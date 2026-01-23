/**
 * Financial calculations for travelers and requesters
 */

import type { Database } from '@/types/database.types'

type BookingStatus = Database['public']['Enums']['booking_status']
type Booking = Database['public']['Tables']['bookings']['Row']

export interface BookingFinancialBreakdown {
  bookingId: string
  transportPrice: number
  commission: number
  protection: number
  netAmount: number
  totalPaid: number
  status: BookingStatus
  trackingNumber: string | null
  deliveryConfirmedAt: string | null
}

export interface TravelerFinancials {
  availableAmount: number // Funds released after confirmation
  pendingAmount: number // Funds pending (paid/deposited/in_transit/delivered without confirmation)
  inTransitAmount: number // in_transit only
  awaitingPickupAmount: number // paid only (avant dépôt)
  bookings: BookingFinancialBreakdown[]
}

export interface RequesterFinancials {
  totalBlocked: number // Net funds held for traveler (paid/deposited/in_transit/delivered, not confirmed)
  totalPaid: number // Net amount paid to traveler (all payments made)
  bookings: BookingFinancialBreakdown[]
}

/**
 * Map booking to financial breakdown
 */
function mapToBreakdown(booking: Booking): BookingFinancialBreakdown {
  const transportPrice = booking.total_price || 0
  const commission = booking.commission_amount || 0
  const protection = booking.insurance_premium || 0
  const totalPaid = transportPrice + commission + protection
  const netAmount = Math.max(0, transportPrice - commission)

  return {
    bookingId: booking.id,
    transportPrice,
    commission,
    protection,
    netAmount,
    totalPaid,
    status: booking.status,
    trackingNumber: booking.tracking_number,
    deliveryConfirmedAt: booking.delivery_confirmed_at || null,
  }
}

/**
 * Calculate traveler financials (amount to receive after commission)
 */
export function calculateTravelerFinancials(bookings: Booking[]): TravelerFinancials {
  const relevantBookings = bookings.filter((b) =>
    ['paid', 'deposited', 'in_transit', 'delivered'].includes(b.status)
  )

  const pendingBookings = relevantBookings.filter((b) => !b.delivery_confirmed_at)
  const confirmedBookings = relevantBookings.filter((b) => b.delivery_confirmed_at)

  const pendingAmount = pendingBookings.reduce((sum, b) => {
    const price = b.total_price || 0
    const commission = b.commission_amount || 0
    return sum + (price - commission)
  }, 0)

  const availableAmount = confirmedBookings.reduce((sum, b) => {
    const price = b.total_price || 0
    const commission = b.commission_amount || 0
    return sum + (price - commission)
  }, 0)

  // In transit = only in_transit bookings
  const inTransitAmount = pendingBookings
    .filter((b) => b.status === 'in_transit')
    .reduce((sum, b) => {
      const price = b.total_price || 0
      const commission = b.commission_amount || 0
      return sum + (price - commission)
    }, 0)

  // Paid = waiting for pickup/deposit
  const awaitingPickupAmount = pendingBookings
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => {
      const price = b.total_price || 0
      const commission = b.commission_amount || 0
      return sum + (price - commission)
    }, 0)

  return {
    availableAmount,
    pendingAmount,
    inTransitAmount,
    awaitingPickupAmount,
    bookings: relevantBookings.map(mapToBreakdown),
  }
}

/**
 * Calculate requester financials (blocked funds)
 */
export function calculateRequesterFinancials(bookings: Booking[]): RequesterFinancials {
  // Blocked bookings = paid, deposited, in_transit, delivered (until confirmed)
  const blockedBookings = bookings.filter((b) =>
    ['paid', 'deposited', 'in_transit', 'delivered'].includes(b.status) &&
    !b.delivery_confirmed_at
  )

  const totalBlocked = blockedBookings.reduce((sum, b) => {
    const price = b.total_price || 0
    const commission = b.commission_amount || 0
    return sum + Math.max(0, price - commission)
  }, 0)

  // Total paid = all bookings with paid_at timestamp
  const totalPaid = bookings
    .filter((b) => b.paid_at !== null)
    .reduce((sum, b) => {
      const price = b.total_price || 0
      const commission = b.commission_amount || 0
      return sum + Math.max(0, price - commission)
    }, 0)

  return {
    totalBlocked,
    totalPaid,
    bookings: blockedBookings.map(mapToBreakdown),
  }
}
