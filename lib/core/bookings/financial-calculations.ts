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
  totalPaid: number
  status: BookingStatus
  trackingNumber: string | null
}

export interface TravelerFinancials {
  totalToReceive: number // Amount after commission for paid + in_transit + delivered
  inTransitAmount: number // in_transit only
  awaitingPickupAmount: number // paid only (avant dépôt)
  bookings: BookingFinancialBreakdown[]
}

export interface RequesterFinancials {
  totalBlocked: number // Funds held (paid/deposited/in_transit/delivered, not confirmed)
  totalPaid: number // All payments made
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

  return {
    bookingId: booking.id,
    transportPrice,
    commission,
    protection,
    totalPaid,
    status: booking.status,
    trackingNumber: booking.tracking_number,
  }
}

/**
 * Calculate traveler financials (amount to receive after commission)
 */
export function calculateTravelerFinancials(bookings: Booking[]): TravelerFinancials {
  // Only count paid, in_transit and delivered bookings
  const relevantBookings = bookings.filter((b) =>
    ['paid', 'deposited', 'in_transit', 'delivered'].includes(b.status)
  )

  // Total amount = transport price minus commission
  const totalToReceive = relevantBookings.reduce((sum, b) => {
    const price = b.total_price || 0
    const commission = b.commission_amount || 0
    return sum + (price - commission)
  }, 0)

  // In transit = only in_transit bookings
  const inTransitAmount = relevantBookings
    .filter((b) => b.status === 'in_transit')
    .reduce((sum, b) => {
      const price = b.total_price || 0
      const commission = b.commission_amount || 0
      return sum + (price - commission)
    }, 0)

  // Paid = waiting for pickup/deposit
  const awaitingPickupAmount = relevantBookings
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => {
      const price = b.total_price || 0
      const commission = b.commission_amount || 0
      return sum + (price - commission)
    }, 0)

  return {
    totalToReceive,
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
    ['paid', 'deposited', 'in_transit', 'delivered'].includes(b.status)
  )

  const totalBlocked = blockedBookings.reduce((sum, b) => {
    const price = b.total_price || 0
    const commission = b.commission_amount || 0
    const protection = b.insurance_premium || 0
    return sum + price + commission + protection
  }, 0)

  // Total paid = all bookings with paid_at timestamp
  const totalPaid = bookings
    .filter((b) => b.paid_at !== null)
    .reduce((sum, b) => {
      const price = b.total_price || 0
      const commission = b.commission_amount || 0
      const protection = b.insurance_premium || 0
      return sum + price + commission + protection
    }, 0)

  return {
    totalBlocked,
    totalPaid,
    bookings: blockedBookings.map(mapToBreakdown),
  }
}
