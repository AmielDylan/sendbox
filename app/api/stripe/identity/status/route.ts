import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { stripe } from '@/lib/shared/services/stripe/config'

type IdentityStatus =
  | 'processing'
  | 'verified'
  | 'requires_input'
  | 'canceled'
  | 'redacted'

const mapRejectionMessage = (code?: string | null, reason?: string | null) => {
  const key = code || reason || 'verification_failed'
  const mapping: Record<string, string> = {
    matching_name_mismatch:
      'Le nom ne correspond pas au document. Corrigez vos informations.',
    matching_dob_mismatch:
      'La date de naissance ne correspond pas au document. Vérifiez votre saisie.',
    document_expired:
      'Le document est expiré. Utilisez un document valide.',
    document_invalid:
      'Le document semble invalide. Essayez un autre document.',
    document_too_old:
      'Le document est trop ancien. Utilisez un document plus récent.',
    selfie_mismatch:
      "Le selfie ne correspond pas au document. Réessayez dans de meilleures conditions.",
    verification_failed:
      "La vérification n'a pas abouti. Réessayez avec un document valide.",
  }

  return mapping[key] || reason || 'La vérification a échoué.'
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Service role manquant' },
      { status: 500 }
    )
  }

  const body = await req.json().catch(() => ({} as { sessionId?: string }))
  const sessionId =
    typeof body?.sessionId === 'string' ? body.sessionId : null

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session de vérification manquante' },
      { status: 400 }
    )
  }

  let session: Stripe.Identity.VerificationSession
  try {
    session = await stripe.identity.verificationSessions.retrieve(sessionId)
  } catch (error) {
    console.error('Stripe Identity retrieve failed:', error)
    return NextResponse.json(
      { error: 'Impossible de récupérer la session de vérification' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const sessionUserId = session.metadata?.user_id || null
  let matchedUserId = sessionUserId === user.id ? user.id : null

  if (!matchedUserId) {
    const accountId = session.metadata?.stripe_account_id
    if (accountId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('stripe_connect_account_id', accountId)
        .maybeSingle()

      if (profile?.id === user.id) {
        matchedUserId = user.id
      }
    }
  }

  if (!matchedUserId) {
    return NextResponse.json(
      { error: 'Accès non autorisé à cette vérification' },
      { status: 403 }
    )
  }

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('kyc_submitted_at, kyc_reviewed_at')
    .eq('id', matchedUserId)
    .maybeSingle()

  const now = new Date().toISOString()
  const status = session.status as IdentityStatus
  let kycStatus: 'pending' | 'approved' | 'rejected' | 'incomplete'
  let rejectionReason: string | null = null
  let submittedAt = existingProfile?.kyc_submitted_at || null
  let reviewedAt = existingProfile?.kyc_reviewed_at || null

  switch (status) {
    case 'processing':
      kycStatus = 'pending'
      submittedAt = submittedAt || now
      break
    case 'verified':
      kycStatus = 'approved'
      reviewedAt = reviewedAt || now
      submittedAt = submittedAt || reviewedAt
      break
    case 'requires_input':
      kycStatus = 'rejected'
      reviewedAt = reviewedAt || now
      rejectionReason =
        session.last_error?.reason ||
        session.last_error?.code ||
        'verification_failed'
      break
    case 'canceled':
      kycStatus = 'incomplete'
      reviewedAt = reviewedAt || now
      rejectionReason = 'verification_canceled'
      break
    case 'redacted':
      kycStatus = 'incomplete'
      reviewedAt = reviewedAt || now
      rejectionReason = 'verification_redacted'
      break
    default:
      kycStatus = 'incomplete'
      break
  }

  const updateData: Record<string, unknown> = {
    kyc_status: kycStatus,
    kyc_submitted_at: submittedAt,
    kyc_reviewed_at: reviewedAt,
    kyc_rejection_reason: rejectionReason,
  }

  if (session.metadata?.document_type) {
    updateData.kyc_document_type = session.metadata.document_type
  }
  if (session.metadata?.document_country) {
    updateData.kyc_nationality = session.metadata.document_country
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update(updateData)
    .eq('id', matchedUserId)

  if (updateError) {
    console.error('Failed to update profile from identity status:', updateError)
  }

  return NextResponse.json({
    status,
    kycStatus,
    rejectionReason:
      kycStatus === 'rejected'
        ? mapRejectionMessage(
            session.last_error?.code,
            session.last_error?.reason
          )
        : null,
    submittedAt,
    reviewedAt,
  })
}
