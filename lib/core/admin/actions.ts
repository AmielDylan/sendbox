/**
 * Server Actions pour l'administration
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { createSystemNotification } from '@/lib/core/notifications/system'
import { formatBookingReportReason } from '@/lib/core/bookings/report-policy'
import { headers } from 'next/headers'

/**
 * Vérifie si l'utilisateur est admin
 */
export async function isAdmin(): Promise<boolean> {
  // createClient() lit les cookies SSR pour identifier l'utilisateur courant
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  // createAdminClient() pour bypasser RLS et lire le rôle du profil
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (profile as any)?.role === 'admin'
}

async function requireAdminAccess() {
  if (!(await isAdmin())) {
    throw new Error('Non autorise')
  }
}

/**
 * Crée un log d'audit
 */
async function createAuditLog(
  actionType: string,
  targetType: string,
  targetId: string,
  details?: Record<string, any>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return
  }

  const headersList = await headers()
  const ipAddress =
    headersList.get('x-forwarded-for') ||
    headersList.get('x-real-ip') ||
    'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  await (supabase.rpc as any)('create_admin_audit_log', {
    p_admin_id: profile.id,
    p_action_type: actionType,
    p_target_type: targetType,
    p_target_id: targetId,
    p_details: details || null,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
  })
}

/**
 * Bannit ou débannit un utilisateur
 */
export async function banUser(
  userId: string,
  banned: boolean,
  reason?: string
) {
  if (!(await isAdmin())) {
    return {
      error: 'Non autorisé',
    }
  }

  const supabase = await createClient()

  const { error } = await (supabase.from('profiles').update as any)({
    is_banned: banned,
    banned_at: banned ? new Date().toISOString() : null,
    banned_reason: banned ? reason || null : null,
  }).eq('id', userId)

  if (error) {
    console.error('Error banning user:', error)
    return {
      error: 'Erreur lors de la modification du statut',
    }
  }

  await createAuditLog('ban_user', 'user', userId, {
    banned,
    reason,
  })

  revalidatePath('/admin/users')
  return {
    success: true,
  }
}

/**
 * Modifie le rôle d'un utilisateur
 */
export async function updateUserRole(
  userId: string,
  role: 'user' | 'partner' | 'admin'
) {
  if (!(await isAdmin())) {
    return {
      error: 'Non autorisé',
    }
  }

  const supabase = await createClient()

  const { error } = await (supabase.from('profiles').update as any)({
    role,
  }).eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return {
      error: 'Erreur lors de la modification du rôle',
    }
  }

  await createAuditLog('update_role', 'user', userId, { role })

  revalidatePath('/admin/users')
  return {
    success: true,
  }
}

/**
 * Force un remboursement pour un booking
 */
export async function forceRefund(bookingId: string, reason: string) {
  if (!(await isAdmin())) {
    return {
      error: 'Non autorisé',
    }
  }

  const supabase = await createClient()

  // Récupérer le booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, total_price, sender_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  const { error } = await (supabase.from('bookings').update as any)({
    status: 'cancelled',
    disputed_reason: reason,
  }).eq('id', bookingId)

  if (error) {
    console.error('Error refunding booking:', error)
    return {
      error: 'Erreur lors du remboursement',
    }
  }

  await createAuditLog('force_refund', 'booking', bookingId, {
    reason,
    amount: booking.total_price,
  })

  revalidatePath('/admin/bookings')
  return {
    success: true,
  }
}

/**
 * Débloque le paiement pour un voyageur
 */
export async function releasePayment(bookingId: string) {
  if (!(await isAdmin())) {
    return {
      error: 'Non autorisé',
    }
  }

  const supabase = await createClient()

  const { error } = await (supabase.from('bookings').update as any)({
    status: 'delivered',
  }).eq('id', bookingId)

  if (error) {
    console.error('Error releasing payment:', error)
    return {
      error: 'Erreur lors du déblocage du paiement',
    }
  }

  await createAuditLog('release_payment', 'booking', bookingId)

  revalidatePath('/admin/bookings')
  return {
    success: true,
  }
}

/**
 * Marque un booking comme litige
 */
export async function markAsDispute(bookingId: string, reason: string) {
  if (!(await isAdmin())) {
    return {
      error: 'Non autorisé',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  const { error } = await (supabase.from('bookings').update as any)({
    status: 'disputed',
    disputed_reason: reason,
  }).eq('id', bookingId)

  if (error) {
    console.error('Error marking as dispute:', error)
    return {
      error: 'Erreur lors du marquage comme litige',
    }
  }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('disputes')
    .select('id')
    .eq('booking_id', bookingId)
    .in('status', ['OPEN', 'UNDER_REVIEW', 'open', 'under_review'])
    .maybeSingle()

  if (!existing) {
    const { error: disputeError } = await admin.from('disputes').insert({
      booking_id: bookingId,
      opened_by_id: user.id,
      reason,
      description: `Litige ouvert par l'administration.\n\nMotif : ${reason}`,
      status: 'OPEN',
      is_public: false,
    })

    if (disputeError) {
      console.error('Error creating dispute record:', disputeError)
      return {
        error:
          'Réservation marquée, mais erreur lors de la création du dossier litige',
      }
    }
  }

  await createAuditLog('mark_dispute', 'booking', bookingId, { reason })

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/disputes')
  return {
    success: true,
  }
}

export async function updateBookingReportStatus(
  reportId: string,
  status: 'reviewing' | 'resolved' | 'dismissed',
  adminNote?: string
) {
  if (!(await isAdmin())) {
    return {
      error: 'Non autorise',
    }
  }

  const normalizedNote = adminNote?.trim() || ''

  if (
    (status === 'resolved' || status === 'dismissed') &&
    normalizedNote.length < 10
  ) {
    return {
      error: 'Ajoutez une note admin de 10 caracteres minimum pour cloturer.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifie',
    }
  }

  const admin = createAdminClient()
  const { data: report, error: reportError } = await admin
    .from('booking_reports')
    .select('id, booking_id, reported_by, reason, status, admin_note')
    .eq('id', reportId)
    .single()

  if (reportError || !report) {
    return {
      error: 'Signalement introuvable',
    }
  }

  if (['resolved', 'dismissed'].includes(report.status)) {
    return {
      error: 'Ce signalement est deja cloture',
    }
  }

  const patch: Record<string, any> = {
    status,
    admin_note: normalizedNote || report.admin_note || null,
  }

  if (status === 'resolved' || status === 'dismissed') {
    patch.resolved_at = new Date().toISOString()
    patch.resolved_by = user.id
  }

  const { error } = await admin
    .from('booking_reports')
    .update(patch)
    .eq('id', reportId)

  if (error) {
    console.error('Error updating booking report:', error)
    return {
      error: 'Erreur lors de la mise a jour du signalement',
    }
  }

  if (status === 'resolved' || status === 'dismissed') {
    const statusLabel = status === 'resolved' ? 'traite' : 'classe'
    const { error: notifError } = await createSystemNotification({
      userId: report.reported_by,
      type: 'system_alert',
      title: 'Signalement mis a jour',
      content: `Votre signalement "${formatBookingReportReason(report.reason)}" a ete ${statusLabel} par Sendbox.${normalizedNote ? ` Note : ${normalizedNote}` : ''}`,
      bookingId: report.booking_id,
      link: `/dashboard/colis/${report.booking_id}`,
    })

    if (notifError) {
      console.error('Notification creation failed (non-blocking):', notifError)
    }
  }

  await createAuditLog('update_booking_report', 'booking_report', reportId, {
    status,
    bookingId: report.booking_id,
    reason: report.reason,
    adminNote: normalizedNote || null,
  })

  revalidatePath('/admin/bookings')
  revalidatePath(`/dashboard/colis/${report.booking_id}`)
  revalidatePath('/dashboard/notifications')

  return {
    success: true,
  }
}

/**
 * Rejette une annonce
 */
export async function rejectAnnouncement(
  announcementId: string,
  reason: string
) {
  if (!(await isAdmin())) {
    return {
      error: 'Non autorisé',
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('announcements')
    .update({
      status: 'cancelled',
    })
    .eq('id', announcementId)

  if (error) {
    console.error('Error rejecting announcement:', error)
    return {
      error: "Erreur lors du rejet de l'annonce",
    }
  }

  await createAuditLog('reject_announcement', 'announcement', announcementId, {
    reason,
  })

  revalidatePath('/admin/announcements')
  return {
    success: true,
  }
}

/**
 * Récupère les statistiques du dashboard admin
 */
export async function getAdminStats() {
  if (!(await isAdmin())) {
    return {
      error: 'Non autorisé',
    }
  }

  const supabase = await createClient()

  // Utilisateurs inscrits
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // KYC en attente
  const { count: pendingKYC } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('kyc_status', 'pending')
    .neq('role', 'admin')

  // Réservations actives
  const { count: activeBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['accepted', 'in_transit'])

  // CA ce mois
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'payment')
    .eq('status', 'completed')
    .gte('created_at', startOfMonth.toISOString())

  const monthlyRevenue =
    transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

  // Nouveaux utilisateurs ce mois
  const { count: newUsersThisMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  // Litiges actifs
  const { count: activeDisputes } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'disputed')

  // Inscriptions sur les 8 dernières semaines
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
  const { data: recentProfiles } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', eightWeeksAgo.toISOString())

  // Volume transactions sur les 30 derniers jours
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('status', 'completed')
    .eq('type', 'payment')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Grouper les inscriptions par semaine (lundi ISO)
  const weekMap: Record<string, number> = {}
  for (const p of recentProfiles || []) {
    if (!p.created_at) continue
    const d = new Date(p.created_at)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const key = monday.toISOString().slice(0, 10)
    weekMap[key] = (weekMap[key] || 0) + 1
  }
  const weeklyRegistrations = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))

  // Grouper les transactions par jour
  const dayMap: Record<string, number> = {}
  for (const t of recentTransactions || []) {
    if (!t.created_at) continue
    const key = new Date(t.created_at).toISOString().slice(0, 10)
    dayMap[key] = (dayMap[key] || 0) + (t.amount || 0)
  }
  const dailyTransactions = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, volume]) => ({ day, volume }))

  return {
    totalUsers: totalUsers || 0,
    pendingKYC: pendingKYC || 0,
    activeBookings: activeBookings || 0,
    monthlyRevenue,
    newUsersThisMonth: newUsersThisMonth || 0,
    activeDisputes: activeDisputes || 0,
    weeklyRegistrations,
    dailyTransactions,
  }
}

/**
 * Approuve un pays personnalisé suggéré lors d'un KYC (pays = "Autre")
 */
export async function approveCustomKYCCountry(
  suggestedByUserId: string,
  label: string
) {
  if (!(await isAdmin())) {
    return { error: 'Non autorisé' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const adminSupabase = createAdminClient()
  const code = label.toUpperCase().replace(/\s+/g, '_').slice(0, 20) + '_CUSTOM'

  const { error } = await (adminSupabase as any)
    .from('kyc_approved_countries')
    .upsert(
      {
        code,
        label,
        suggested_by: suggestedByUserId,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'code' }
    )

  if (error) {
    console.error('[approveCustomKYCCountry]', error)
    return { error: "Erreur lors de l'enregistrement" }
  }

  return { success: true }
}

export async function getAdminAnnouncements(
  filter?: 'sendbox' | 'sendbox_available'
) {
  await requireAdminAccess()

  const supabase = createAdminClient()
  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter === 'sendbox') query = query.eq('is_sendbox', true)
  else if (filter === 'sendbox_available')
    query = query.eq('sendbox_available', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAdminBookings() {
  await requireAdminAccess()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      booking_reports (
        id,
        reason,
        message,
        status,
        admin_note,
        suggested_new_date,
        reported_by,
        created_at
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAdminDisputes() {
  await requireAdminAccess()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('disputes')
    .select(
      `
      id,
      booking_id,
      opened_by_id,
      reason,
      description,
      status,
      is_public,
      opened_at,
      bookings:booking_id (
        id,
        status,
        total_price,
        kilos_requested,
        sender_id,
        traveler_id
      )
    `
    )
    .in('status', ['OPEN', 'UNDER_REVIEW', 'open', 'under_review'])
    .order('opened_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAdminTransactions() {
  await requireAdminAccess()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return data ?? []
}
