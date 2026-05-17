import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { processKYCMRZ } from '@/lib/core/kyc/mrz'
import { sendEmail } from '@/lib/shared/services/email/client'
import { processKYCFile } from '@/lib/core/kyc/file-pipeline'

const PIPELINE_ERRORS: Record<string, { message: string; status: number }> = {
  FILE_TOO_LARGE: {
    message: 'Fichier trop volumineux (max 10 Mo)',
    status: 400,
  },
  INVALID_FILE_FORMAT: {
    message: 'Format non supporté. Formats acceptés : JPG, PNG, HEIC, PDF',
    status: 422,
  },
  PDF_ENCRYPTED: {
    message: 'Le PDF est protégé par un mot de passe',
    status: 422,
  },
  PDF_RENDER_ERROR: {
    message:
      'Impossible de traiter le PDF. Veuillez fournir une image JPG, PNG ou HEIC à la place.',
    status: 422,
  },
  FILE_PROCESSING_ERROR: {
    message: 'Erreur lors du traitement du fichier',
    status: 500,
  },
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 2. Parse multipart form
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Corps de la requête invalide' },
      { status: 400 }
    )
  }

  const consent = formData.get('consent')
  if (consent !== 'true') {
    return NextResponse.json(
      { error: 'Le consentement est obligatoire' },
      { status: 400 }
    )
  }

  const docFile = formData.get('docFile') as File | null
  const selfieFile = formData.get('selfieFile') as File | null
  if (!docFile || !selfieFile) {
    return NextResponse.json(
      { error: 'Les deux fichiers sont requis' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const ts = Date.now()
  const idPath = `${user.id}/id-${ts}.jpg`
  const selfiePath = `${user.id}/selfie-${ts}.jpg`

  // 3. Validation + conversion via pipeline sécurisé
  const [docResult, selfieResult] = await Promise.all([
    processKYCFile(Buffer.from(await docFile.arrayBuffer())),
    processKYCFile(Buffer.from(await selfieFile.arrayBuffer())),
  ])

  if (!docResult.ok) {
    const err = PIPELINE_ERRORS[docResult.code] ?? {
      message: 'Erreur fichier',
      status: 422,
    }
    return NextResponse.json(
      { error: err.message, code: docResult.code },
      { status: err.status }
    )
  }
  if (!selfieResult.ok) {
    const err = PIPELINE_ERRORS[selfieResult.code] ?? {
      message: 'Erreur fichier',
      status: 422,
    }
    return NextResponse.json(
      { error: err.message, code: selfieResult.code },
      { status: err.status }
    )
  }

  // 4. Upload des buffers JPEG résultants (bypass RLS bucket)
  const [{ error: docErr }, { error: selfieErr }] = await Promise.all([
    admin.storage.from('kyc-documents').upload(idPath, docResult.buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    }),
    admin.storage
      .from('kyc-documents')
      .upload(selfiePath, selfieResult.buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      }),
  ])

  if (docErr || selfieErr) {
    console.error('KYC upload error:', docErr ?? selfieErr)
    return NextResponse.json(
      { error: "Erreur lors de l'upload des fichiers" },
      { status: 500 }
    )
  }

  // 5. Mettre à jour profiles
  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      kyc_submitted_at: new Date().toISOString(),
      verification_status: 'pending',
      kyc_document_front: idPath,
      kyc_document_back: selfiePath,
      kyc_rejection_reason: null,
    })
    .eq('id', user.id)

  if (profileErr) {
    console.error('KYC profile update error:', profileErr)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }

  // 6. Insérer dans kyc_reviews
  const docType = formData.get('docType') as string | null
  const docCountry = formData.get('country') as string | null
  const customCtry = formData.get('customCountry') as string | null

  const { error: reviewErr } = await admin.from('kyc_reviews').insert({
    user_id: user.id,
    consent_at: new Date().toISOString(),
    status: 'PENDING',
    doc_type: docType || null,
    doc_country: docCountry || null,
    custom_country: customCtry || null,
  })

  if (reviewErr) {
    console.error('KYC review insert error:', reviewErr)
  }

  // 7. Notifier l'admin par email (fire-and-forget)
  ;(async () => {
    const { data: userProfile } = await admin
      .from('profiles')
      .select('firstname, lastname, email')
      .eq('id', user.id)
      .single()
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      const displayName =
        [userProfile?.firstname, userProfile?.lastname]
          .filter(Boolean)
          .join(' ') ||
        userProfile?.email ||
        user.id
      const docTypeLabel =
        docType === 'passport'
          ? 'Passeport'
          : docType === 'cni'
            ? 'CNI'
            : 'Non précisé'
      await sendEmail({
        to: adminEmail,
        subject: `[KYC] Nouveau dossier à vérifier — ${displayName}`,
        template: 'notification',
        data: {
          title: 'Nouveau dossier KYC à vérifier',
          content: `Un nouveau dossier KYC vient d'être soumis et attend votre validation.\n\nUtilisateur : ${displayName}\nEmail : ${userProfile?.email || '—'}\nType de pièce : ${docTypeLabel}\nPays d'émission : ${docCountry === 'other' ? `Autre — ${customCtry || '?'}` : docCountry || 'Non précisé'}`,
          ctaText: 'Examiner le dossier',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/kyc/${user.id}`,
        },
      })
    }
  })().catch(console.error)

  // 8. Fire-and-forget MRZ (fragile en serverless — le fallback est dans /admin/kyc/[id])
  processKYCMRZ(user.id, idPath).catch(err =>
    console.error('[kyc/submit] MRZ processing failed:', err)
  )

  return NextResponse.json({ ok: true })
}
