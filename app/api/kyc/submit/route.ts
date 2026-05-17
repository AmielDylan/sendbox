import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { processKYCMRZ } from '@/lib/core/kyc/mrz'

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
    return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 })
  }

  const consent = formData.get('consent')
  if (consent !== 'true') {
    return NextResponse.json({ error: 'Le consentement est obligatoire' }, { status: 400 })
  }

  const docFile = formData.get('docFile') as File | null
  const selfieFile = formData.get('selfieFile') as File | null
  if (!docFile || !selfieFile) {
    return NextResponse.json({ error: 'Les deux fichiers sont requis' }, { status: 400 })
  }

  if (docFile.size > 10 * 1024 * 1024 || selfieFile.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
  }

  const admin = createAdminClient()
  const ts = Date.now()
  const idPath = `${user.id}/id-${ts}.jpg`
  const selfiePath = `${user.id}/selfie-${ts}.jpg`

  // 3. Upload via service role (bypass RLS bucket)
  const docBuffer = Buffer.from(await docFile.arrayBuffer())
  const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer())

  const [{ error: docErr }, { error: selfieErr }] = await Promise.all([
    admin.storage.from('kyc-documents').upload(idPath, docBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    }),
    admin.storage.from('kyc-documents').upload(selfiePath, selfieBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    }),
  ])

  if (docErr || selfieErr) {
    console.error('KYC upload error:', docErr ?? selfieErr)
    return NextResponse.json({ error: "Erreur lors de l'upload des fichiers" }, { status: 500 })
  }

  // 4. Mettre à jour profiles
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
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil' }, { status: 500 })
  }

  // 5. Insérer dans kyc_reviews
  const { error: reviewErr } = await admin.from('kyc_reviews').insert({
    user_id: user.id,
    consent_at: new Date().toISOString(),
    status: 'PENDING',
  })

  if (reviewErr) {
    console.error('KYC review insert error:', reviewErr)
  }

  // 6. Fire-and-forget MRZ (fragile en serverless — le fallback est dans /admin/kyc/[id])
  processKYCMRZ(user.id, idPath).catch(err =>
    console.error('[kyc/submit] MRZ processing failed:', err),
  )

  return NextResponse.json({ ok: true })
}
