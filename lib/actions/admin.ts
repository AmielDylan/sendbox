/**
 * Server Actions pour l'administration
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * Vérifie si l'utilisateur est admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return (profile as any)?.role === 'admin'
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
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return
  }

  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
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
export async function banUser(userId: string, banned: boolean, reason?: string) {
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
export async function updateUserRole(userId: string, role: 'user' | 'admin') {
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
    .select('id, payment_intent_id, total_price, sender_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  // TODO: Implémenter le remboursement Stripe
  // Pour l'instant, on met juste le statut à cancelled

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

  // TODO: Implémenter le transfert Stripe au voyageur
  // Pour l'instant, on met juste le statut à delivered

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

  await createAuditLog('mark_dispute', 'booking', bookingId, { reason })

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/disputes')
  return {
    success: true,
  }
}

/**
 * Rejette une annonce
 */
export async function rejectAnnouncement(announcementId: string, reason: string) {
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
      error: 'Erreur lors du rejet de l\'annonce',
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

  // Réservations actives
  const { count: activeBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['confirmed', 'in_transit'])

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

  return {
    totalUsers: totalUsers || 0,
    pendingKYC: pendingKYC || 0,
    activeBookings: activeBookings || 0,
    monthlyRevenue,
  }
}

