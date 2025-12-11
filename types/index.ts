/**
 * Types TypeScript globaux pour Sendbox
 *
 * Types métier avec computed fields et relations
 */

import type {
  Profile as ProfileBase,
  Announcement as AnnouncementBase,
  Booking as BookingBase,
  Message as MessageBase,
  Notification as NotificationBase,
  Rating as RatingBase,
  Transaction as TransactionBase,
} from './database.types'

// ============================================================================
// Profile
// ============================================================================

export interface Profile extends ProfileBase {
  // Computed fields
  full_name: string
  initials: string
  display_name: string
}

/**
 * Helper pour créer un Profile avec computed fields
 */
export function createProfile(profile: ProfileBase): Profile {
  const firstName = profile.first_name || ''
  const lastName = profile.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'Utilisateur'

  return {
    ...profile,
    full_name: fullName,
    initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U',
    display_name: fullName || profile.user_id.slice(0, 8),
  }
}

// ============================================================================
// Announcement
// ============================================================================

export interface Announcement extends AnnouncementBase {
  // Relations
  traveler?: Profile

  // Computed fields
  remaining_kg: number
  is_active: boolean
  can_book: boolean
  formatted_price: string
  formatted_date: string
}

/**
 * Helper pour créer un Announcement avec computed fields
 */
export function createAnnouncement(
  announcement: AnnouncementBase,
  totalBookedKg: number = 0
): Announcement {
  const remainingKg = Math.max(0, announcement.max_weight_kg - totalBookedKg)
  const isActive = announcement.status === 'active'
  const canBook = isActive && remainingKg > 0

  return {
    ...announcement,
    remaining_kg: remainingKg,
    is_active: isActive,
    can_book: canBook,
    formatted_price: `€${announcement.price_per_kg.toFixed(2)}/kg`,
    formatted_date: new Date(announcement.departure_date).toLocaleDateString(
      'fr-FR',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    ),
  }
}

// ============================================================================
// Booking
// ============================================================================

export interface Booking extends BookingBase {
  // Relations
  sender?: Profile
  traveler?: Profile
  announcement?: Announcement

  // Computed fields
  total_price: number
  formatted_price: string
  formatted_status: string
  is_pending: boolean
  is_confirmed: boolean
  is_in_transit: boolean
  is_delivered: boolean
  is_cancelled: boolean
}

/**
 * Helper pour créer un Booking avec computed fields
 */
export function createBooking(
  booking: BookingBase,
  pricePerKg?: number
): Booking {
  const totalPrice = pricePerKg ? booking.weight_kg * pricePerKg : 0

  return {
    ...booking,
    total_price: totalPrice,
    formatted_price: `€${totalPrice.toFixed(2)}`,
    formatted_status: getBookingStatusLabel(booking.status),
    is_pending: booking.status === 'pending',
    is_confirmed: booking.status === 'confirmed',
    is_in_transit: booking.status === 'in_transit',
    is_delivered: booking.status === 'delivered',
    is_cancelled: booking.status === 'cancelled',
  }
}

function getBookingStatusLabel(status: BookingBase['status']): string {
  const labels: Record<BookingBase['status'], string> = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    in_transit: 'En transit',
    delivered: 'Livré',
    cancelled: 'Annulé',
  }
  return labels[status] || status
}

// ============================================================================
// Message
// ============================================================================

export interface Message extends MessageBase {
  // Relations
  sender?: Profile
  receiver?: Profile
  booking?: Booking

  // Computed fields
  is_read: boolean
  formatted_date: string
  time_ago: string
}

/**
 * Helper pour créer un Message avec computed fields
 */
export function createMessage(message: MessageBase): Message {
  const createdAt = new Date(message.created_at)
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  let timeAgo: string
  if (diffMins < 1) {
    timeAgo = "À l'instant"
  } else if (diffMins < 60) {
    timeAgo = `Il y a ${diffMins} min`
  } else if (diffHours < 24) {
    timeAgo = `Il y a ${diffHours}h`
  } else if (diffDays < 7) {
    timeAgo = `Il y a ${diffDays}j`
  } else {
    timeAgo = createdAt.toLocaleDateString('fr-FR')
  }

  return {
    ...message,
    is_read: message.read_at !== null,
    formatted_date: createdAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    time_ago: timeAgo,
  }
}

// ============================================================================
// Notification
// ============================================================================

export interface Notification extends NotificationBase {
  // Computed fields
  is_read: boolean
  formatted_date: string
  time_ago: string
  action_url?: string
}

/**
 * Helper pour créer une Notification avec computed fields
 */
export function createNotification(
  notification: NotificationBase
): Notification {
  const createdAt = new Date(notification.created_at)
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  let timeAgo: string
  if (diffMins < 1) {
    timeAgo = "À l'instant"
  } else if (diffMins < 60) {
    timeAgo = `Il y a ${diffMins} min`
  } else if (diffHours < 24) {
    timeAgo = `Il y a ${diffHours}h`
  } else if (diffDays < 7) {
    timeAgo = `Il y a ${diffDays}j`
  } else {
    timeAgo = createdAt.toLocaleDateString('fr-FR')
  }

  // Générer action_url depuis metadata si disponible
  let actionUrl: string | undefined
  if (notification.metadata && typeof notification.metadata === 'object') {
    const metadata = notification.metadata as Record<string, unknown>
    if (typeof metadata.booking_id === 'string') {
      actionUrl = `/dashboard/bookings/${metadata.booking_id}`
    } else if (typeof metadata.announcement_id === 'string') {
      actionUrl = `/dashboard/annonces/${metadata.announcement_id}`
    }
  }

  return {
    ...notification,
    is_read: notification.read_at !== null,
    formatted_date: createdAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    time_ago: timeAgo,
    action_url: actionUrl,
  }
}

// ============================================================================
// Rating
// ============================================================================

export interface Rating extends RatingBase {
  // Relations
  rater?: Profile
  rated?: Profile
  booking?: Booking

  // Computed fields
  formatted_date: string
}

/**
 * Helper pour créer un Rating avec computed fields
 */
export function createRating(rating: RatingBase): Rating {
  return {
    ...rating,
    formatted_date: new Date(rating.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }
}

// ============================================================================
// Transaction
// ============================================================================

export interface Transaction extends TransactionBase {
  // Relations
  booking?: Booking

  // Computed fields
  formatted_amount: string
  formatted_date: string
  is_pending: boolean
  is_completed: boolean
  is_failed: boolean
  is_refunded: boolean
}

/**
 * Helper pour créer une Transaction avec computed fields
 */
export function createTransaction(transaction: TransactionBase): Transaction {
  return {
    ...transaction,
    formatted_amount: `${transaction.currency === 'EUR' ? '€' : transaction.currency}${transaction.amount.toFixed(2)}`,
    formatted_date: new Date(transaction.created_at).toLocaleDateString(
      'fr-FR',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    ),
    is_pending: transaction.status === 'pending',
    is_completed: transaction.status === 'completed',
    is_failed: transaction.status === 'failed',
    is_refunded: transaction.status === 'refunded',
  }
}

// ============================================================================
// Types utilitaires
// ============================================================================

export type Database = import('./database.types').Database
