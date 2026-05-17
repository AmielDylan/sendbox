import { createClient } from '@/lib/shared/db/server'
import { createSystemNotification } from '@/lib/core/notifications/system'
import { FEATURES } from '@/lib/shared/config/features'

const SETUP_NOTIFICATION_TITLES = [
  'Action requise : identité et paiements',
  "Action requise : vérification d'identité",
  'Action requise : activer vos paiements',
]

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
    .select('id, role, kyc_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return Response.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (profile.role === 'admin') {
    return Response.json({ success: true })
  }

  // Clean up all previous "Action requise" setup notifications (any title variant)
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('type', 'system_alert')
    .in('title', SETUP_NOTIFICATION_TITLES)

  const needsKyc = FEATURES.KYC_ENABLED && profile.kyc_status !== 'approved'

  if (!needsKyc) {
    return Response.json({ success: true })
  }

  const { error } = await createSystemNotification({
    userId: user.id,
    type: 'system_alert',
    title: "Action requise : vérification d'identité",
    content: 'Veuillez vérifier votre identité pour débloquer toutes les fonctionnalités.',
  })

  if (error) {
    return Response.json({ error: 'Erreur notification' }, { status: 500 })
  }

  return Response.json({ success: true })
}
