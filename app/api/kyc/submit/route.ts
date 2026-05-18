import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { sendEmail } from '@/lib/shared/services/email/client'
import { processKYCFile } from '@/lib/core/kyc/file-pipeline'

const PIPELINE_ERRORS: Record<string, { message: string; status: number }> = {
  FILE_TOO_LARGE: {
    message: 'Fichier trop volumineux (max 10 Mo)',
    status: 400,
  },
  INVALID_FILE_FORMAT: {
    message: 'Format non supporté. Formats acceptés : JPG, PNG, HEIC',
    status: 422,
  },
  FILE_PROCESSING_ERROR: {
    message: 'Erreur lors du traitement du fichier',
    status: 500,
  },
}

export async function POST(req: NextRequest) {
  try {
    return await handleKYCSubmit(req)
  } catch (err: any) {
    console.error('[kyc/submit] Unhandled error:', err?.message ?? err)
    return NextResponse.json(
      { error: `Erreur serveur inattendue : ${err?.message ?? 'unknown'}` },
      { status: 500 }
    )
  }
}

async function handleKYCSubmit(req: NextRequest) {
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

  const frontFile = formData.get('frontFile') as File | null
  const backFile = formData.get('backFile') as File | null
  const selfieFile = formData.get('selfieFile') as File | null
  const documentType = formData.get('documentType') as string | null

  if (!frontFile || !selfieFile) {
    return NextResponse.json(
      { error: 'Les fichiers recto et selfie sont requis' },
      { status: 400 }
    )
  }
  if (documentType === 'cni' && !backFile) {
    return NextResponse.json(
      {
        error: 'Le verso de la CNI est obligatoire',
        code: 'BACK_REQUIRED',
      },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const ts = Date.now()
  const frontPath = `${user.id}/front-${ts}.jpg`
  const backPath = `${user.id}/back-${ts}.jpg`
  const selfiePath = `${user.id}/selfie-${ts}.jpg`

  // 3. Validation + conversion via pipeline sécurisé
  const [frontResult, selfieResult] = await Promise.all([
    processKYCFile(Buffer.from(await frontFile.arrayBuffer())),
    processKYCFile(Buffer.from(await selfieFile.arrayBuffer())),
  ])
  const backResult = backFile
    ? await processKYCFile(Buffer.from(await backFile.arrayBuffer()))
    : null

  if (!frontResult.ok) {
    const err = PIPELINE_ERRORS[frontResult.code] ?? {
      message: 'Erreur fichier',
      status: 422,
    }
    return NextResponse.json(
      { error: err.message, code: frontResult.code },
      { status: err.status }
    )
  }
  if (backResult && !backResult.ok) {
    const err = PIPELINE_ERRORS[backResult.code] ?? {
      message: 'Erreur fichier',
      status: 422,
    }
    return NextResponse.json(
      { error: err.message, code: backResult.code },
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

  // 4. Upload front + selfie (toujours), back conditionnel
  const [{ error: frontErr }, { error: selfieErr }] = await Promise.all([
    admin.storage.from('kyc-documents').upload(frontPath, frontResult.buffer, {
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

  if (frontErr || selfieErr) {
    console.error('KYC upload error (front/selfie):', frontErr ?? selfieErr)
    return NextResponse.json(
      { error: "Erreur lors de l'upload des fichiers" },
      { status: 500 }
    )
  }

  let backUploaded = false
  if (backResult?.ok) {
    const { error: backErr } = await admin.storage
      .from('kyc-documents')
      .upload(backPath, backResult.buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })
    if (backErr) {
      console.error('KYC upload error (back):', backErr)
      return NextResponse.json(
        { error: "Erreur lors de l'upload des fichiers" },
        { status: 500 }
      )
    }
    backUploaded = true
  }

  // 5. Mettre à jour profiles
  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      kyc_submitted_at: new Date().toISOString(),
      verification_status: 'pending',
      kyc_document_front: frontPath,
      kyc_document_back: backUploaded ? backPath : null,
      kyc_selfie: selfiePath,
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
  const docCountry = formData.get('country') as string | null
  const customCtry = formData.get('customCountry') as string | null

  const { error: reviewErr } = await admin.from('kyc_reviews').insert({
    user_id: user.id,
    consent_at: new Date().toISOString(),
    status: 'PENDING',
    doc_type: documentType || null,
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
        documentType === 'passport'
          ? 'Passeport'
          : documentType === 'cni'
            ? 'CNI'
            : 'Non précisé'
      await sendEmail({
        to: adminEmail,
        subject: `[KYC] Nouveau dossier à vérifier : ${displayName}`,
        template: 'notification',
        data: {
          title: 'Nouveau dossier KYC à vérifier',
          content: `Un nouveau dossier KYC vient d'être soumis et attend votre validation.\n\nUtilisateur : ${displayName}\nEmail : ${userProfile?.email || '-'}\nType de pièce : ${docTypeLabel}\nPays d'émission : ${docCountry === 'other' ? `Autre : ${customCtry || '?'}` : docCountry || 'Non précisé'}`,
          ctaText: 'Examiner le dossier',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/kyc/${user.id}`,
        },
      })
    }
  })().catch(console.error)

  return NextResponse.json({ ok: true })
}
