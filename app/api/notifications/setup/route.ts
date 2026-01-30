import { createClient } from '@/lib/shared/db/server'
import { createSystemNotification } from '@/lib/core/notifications/system'
import { FEATURES } from '@/lib/shared/config/features'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, kyc_status, stripe_payouts_enabled')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return Response.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (profile.role === 'admin') {
    return Response.json({ success: true })
  }

  const needsKyc =
    FEATURES.KYC_ENABLED && profile.kyc_status !== 'approved'
  const needsPayments =
    FEATURES.STRIPE_PAYMENTS && !profile.stripe_payouts_enabled

  if (!needsKyc && !needsPayments) {
    return Response.json({ success: true })
  }

  const title = needsKyc && needsPayments
    ? 'Action requise : identité et paiements'
    : needsKyc
      ? "Action requise : vérification d'identité"
      : 'Action requise : activer vos paiements'

  const content = needsKyc && needsPayments
    ? "Vérifiez votre identité et activez vos paiements pour recevoir vos gains."
    : needsKyc
      ? "Veuillez vérifier votre identité pour débloquer toutes les fonctionnalités."
      : "Activez vos paiements pour recevoir vos gains."

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'system_alert')
    .eq('title', title)
    .limit(1)

  if (existing && existing.length > 0) {
    return Response.json({ success: true })
  }

  const { error } = await createSystemNotification({
    userId: user.id,
    type: 'system_alert',
    title,
    content,
  })

  if (error) {
    return Response.json({ error: 'Erreur notification' }, { status: 500 })
  }

  return Response.json({ success: true })
}
