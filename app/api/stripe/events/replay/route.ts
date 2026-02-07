import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { stripe } from '@/lib/shared/services/stripe/config'
import { createSystemNotification } from '@/lib/core/notifications/system'
import type Stripe from 'stripe'
import type { Database } from '@/types/database.types'

type ReplayRequestBody = {
  eventId?: string
  stripeAccount?: string
  dryRun?: boolean
}

type KycStatus = 'pending' | 'approved' | 'rejected' | 'incomplete'

const withIdentityMetadata = (
  updateData: Record<string, unknown>,
  session: Stripe.Identity.VerificationSession
) => {
  const documentType = session.metadata?.document_type
  if (documentType) {
    updateData.kyc_document_type = documentType
  }
  const documentCountry = session.metadata?.document_country
  if (documentCountry) {
    updateData.kyc_nationality = documentCountry
  }
  return updateData
}

const notifyKycStatusChange = async (
  userId: string,
  status: KycStatus,
  rejectionReason?: string | null
) => {
  const titleMap: Record<KycStatus, string> = {
    pending: 'Vérification en cours',
    approved: 'Identité vérifiée',
    rejected: 'Vérification refusée',
    incomplete: 'Vérification à compléter',
  }

  const contentMap: Record<KycStatus, string> = {
    pending:
      "Votre vérification d'identité est en cours de traitement. Vous serez notifié dès qu'elle sera terminée.",
    approved:
      'Votre identité a été vérifiée avec succès. Toutes les actions sont désormais débloquées.',
    rejected: rejectionReason
      ? `Votre vérification a été refusée : ${rejectionReason}. Vous pouvez soumettre de nouveaux documents.`
      : 'Votre vérification a été refusée. Vous pouvez soumettre de nouveaux documents.',
    incomplete:
      "Votre vérification d'identité n'a pas été finalisée. Veuillez relancer la procédure.",
  }

  const { error } = await createSystemNotification({
    userId,
    type: 'system_alert',
    title: titleMap[status],
    content: contentMap[status],
  })

  if (error) {
    console.error('❌ KYC notification creation failed (non-blocking):', error)
  }
}

const updateKycProfile = async (
  supabase: ReturnType<typeof createAdminClient>,
  userId: string | null | undefined,
  updateData: Record<string, unknown>,
  session: Stripe.Identity.VerificationSession,
  dryRun: boolean
) => {
  if (dryRun) {
    return { id: userId ?? null }
  }

  let updatedRow: { id?: string } | null = null

  if (userId) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id')

    if (error) {
      console.error('❌ Failed to update profile by user_id:', error)
    } else if (data && data.length > 0) {
      updatedRow = data[0]
    }
  }

  if (!updatedRow) {
    const accountId = session.metadata?.stripe_account_id
    if (accountId) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('stripe_connect_account_id', accountId)
        .select('id')

      if (error) {
        console.error(
          '❌ Failed to update profile by stripe_connect_account_id:',
          error
        )
      } else if (data && data.length > 0) {
        updatedRow = data[0]
      }
    }
  }

  if (!updatedRow) {
    console.error(
      '❌ Unable to update profile for verification session:',
      session.id
    )
  }

  return updatedRow
}

const handleAccountUpdated = async (
  supabase: ReturnType<typeof createAdminClient>,
  account: Stripe.Account,
  dryRun: boolean
) => {
  const payoutsEnabled = Boolean(account.payouts_enabled)
  const requirements = account.requirements || null
  const requirementsJson = requirements
    ? (JSON.parse(JSON.stringify(requirements)) as Database['public']['Tables']['profiles']['Row']['stripe_requirements'])
    : null
  const onboardingCompleted =
    payoutsEnabled &&
    !requirements?.currently_due?.length &&
    !requirements?.past_due?.length
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, payout_method, stripe_payouts_enabled, kyc_status, kyc_reviewed_at, kyc_submitted_at'
    )
    .eq('stripe_connect_account_id', account.id)
    .maybeSingle()

  const payoutMethod = (profile as any)?.payout_method as
    | 'stripe_bank'
    | 'mobile_wallet'
    | undefined
  const shouldUpdatePayoutMethod = payoutMethod !== 'mobile_wallet'
  const nextPayoutStatus = payoutsEnabled ? 'active' : 'pending'
  const updatePayload: Record<string, any> = {
    stripe_payouts_enabled: payoutsEnabled,
    stripe_onboarding_completed: onboardingCompleted,
    stripe_requirements: requirementsJson,
  }

  const individualVerificationStatus = account.individual?.verification?.status
  const documentVerificationStatus =
    account.individual?.verification?.document?.status
  const isIdentityVerified =
    individualVerificationStatus === 'verified' ||
    documentVerificationStatus === 'verified'

  if (isIdentityVerified) {
    const reviewedAt = new Date().toISOString()
    updatePayload.kyc_status = 'approved'
    updatePayload.kyc_reviewed_at = profile?.kyc_reviewed_at || reviewedAt
    if (!profile?.kyc_submitted_at) {
      updatePayload.kyc_submitted_at = reviewedAt
    }
    updatePayload.kyc_rejection_reason = null
  }

  if (shouldUpdatePayoutMethod) {
    updatePayload.payout_method = payoutMethod || 'stripe_bank'
    updatePayload.payout_status = nextPayoutStatus
  }

  if (dryRun) {
    return { profileId: profile?.id ?? null, updated: false }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload as any)
    .eq('stripe_connect_account_id', account.id)

  if (error) {
    console.error('❌ Failed to update connect status:', error)
  } else {
    if (isIdentityVerified && profile?.id && profile?.kyc_status !== 'approved') {
      await notifyKycStatusChange(profile.id, 'approved')
    }

    if (payoutsEnabled && profile?.id && !profile?.stripe_payouts_enabled) {
      await createSystemNotification({
        userId: profile.id,
        type: 'system_alert',
        title: 'Paiements activés',
        content:
          'Votre compte bancaire est vérifié. Les virements sont maintenant disponibles.',
      })
    }
  }

  return { profileId: profile?.id ?? null, updated: true }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 }
    )
  }

  const body = (await req.json().catch(() => null)) as ReplayRequestBody | null
  const eventId = body?.eventId
  const stripeAccount = body?.stripeAccount
  const dryRun = Boolean(body?.dryRun)

  if (!eventId) {
    return NextResponse.json({ error: 'eventId requis' }, { status: 400 })
  }

  const event = await stripe.events.retrieve(
    eventId,
    undefined,
    stripeAccount ? { stripeAccount } : undefined
  )

  const adminClient = createAdminClient()

  switch (event.type) {
    case 'identity.verification_session.processing':
    case 'identity.verification_session.verified':
    case 'identity.verification_session.requires_input':
    case 'identity.verification_session.canceled':
    case 'identity.verification_session.redacted': {
      const verificationSession = event.data
        .object as Stripe.Identity.VerificationSession
      const userId = verificationSession.metadata?.user_id

      const receivedAt = new Date().toISOString()
      let status: KycStatus = 'pending'
      let rejectionReason: string | null = null

      if (event.type === 'identity.verification_session.verified') {
        status = 'approved'
      } else if (event.type === 'identity.verification_session.requires_input') {
        status = 'rejected'
        rejectionReason =
          verificationSession.last_error?.reason ||
          verificationSession.last_error?.code ||
          'verification_failed'
      } else if (
        event.type === 'identity.verification_session.canceled' ||
        event.type === 'identity.verification_session.redacted'
      ) {
        status = 'incomplete'
        rejectionReason =
          event.type === 'identity.verification_session.canceled'
            ? 'verification_canceled'
            : 'verification_redacted'
      }

      const updateData = withIdentityMetadata(
        {
          kyc_status: status,
          kyc_submitted_at:
            status === 'pending'
              ? receivedAt
              : undefined,
          kyc_reviewed_at:
            status === 'pending'
              ? undefined
              : receivedAt,
          kyc_rejection_reason: status === 'approved' ? null : rejectionReason,
        },
        verificationSession
      )

      const updated = await updateKycProfile(
        adminClient,
        userId,
        updateData,
        verificationSession,
        dryRun
      )

      if (updated?.id || userId) {
        await notifyKycStatusChange(updated?.id || userId, status, rejectionReason)
      }

      return NextResponse.json({
        processed: true,
        type: event.type,
        dryRun,
      })
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      const result = await handleAccountUpdated(
        adminClient,
        account,
        dryRun
      )

      return NextResponse.json({
        processed: true,
        type: event.type,
        dryRun,
        profileId: result.profileId,
      })
    }

    default:
      return NextResponse.json({
        processed: false,
        type: event.type,
        reason: 'Event type not handled by replay endpoint',
      })
  }
}
