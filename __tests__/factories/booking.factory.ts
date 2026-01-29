import { faker } from '@faker-js/faker'
import {
  createMockSender,
  createMockTraveler,
  type MockUser,
} from './user.factory'
import {
  createMockAnnouncement,
  type MockAnnouncement,
} from './announcement.factory'

/**
 * Factory pour créer des réservations de test
 */

export type MockBookingStatus =
  | 'pending'
  | 'accepted'
  | 'refused'
  | 'paid'
  | 'deposited'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'disputed'

export interface MockBooking {
  id: string
  announcement_id: string
  sender_id: string
  traveler_id: string
  package_description: string
  weight: number
  package_value?: number | null
  base_price: number
  commission: number
  total_price: number
  status: MockBookingStatus
  tracking_code?: string | null
  deposit_proof_url?: string | null
  delivery_proof_url?: string | null
  qr_code?: string | null
  created_at: string
  updated_at: string
  confirmed_deposit_at?: string | null
  confirmed_delivery_at?: string | null
  refused_at?: string | null
  refused_reason?: string | null
  cancelled_at?: string | null
  cancelled_by?: string | null
  cancelled_reason?: string | null
}

/**
 * Calcule les montants de la réservation (base_price, commission, total_price)
 */
function calculateBookingAmounts(weight: number, pricePerKg: number = 10) {
  const basePrice = weight * pricePerKg
  const commission = Math.round(basePrice * 0.12) // 12% commission
  const totalPrice = basePrice + commission

  return { basePrice, commission, totalPrice }
}

/**
 * Crée une mock booking avec des données aléatoires ou personnalisées
 */
export function createMockBooking(
  overrides?: Partial<MockBooking> & {
    sender?: MockUser
    traveler?: MockUser
    announcement?: MockAnnouncement
  }
): MockBooking {
  const now = new Date().toISOString()

  // Créer les utilisateurs si pas fournis
  const sender = overrides?.sender || createMockSender()
  const traveler = overrides?.traveler || createMockTraveler()
  const announcement =
    overrides?.announcement || createMockAnnouncement({ traveler })

  // Poids aléatoire entre 1 et 10kg
  const weight = overrides?.weight || faker.number.int({ min: 1, max: 10 })
  const pricePerKg = announcement.price_per_kg

  // Calculer les montants
  const { basePrice, commission, totalPrice } = calculateBookingAmounts(
    weight,
    pricePerKg
  )

  return {
    id: faker.string.uuid(),
    announcement_id: announcement.id,
    sender_id: sender.id,
    traveler_id: traveler.id,
    package_description: faker.commerce.productDescription(),
    weight,
    package_value: faker.number.int({ min: 50, max: 500 }),
    base_price: basePrice,
    commission,
    total_price: totalPrice,
    status: 'pending',
    tracking_code: null,
    deposit_proof_url: null,
    delivery_proof_url: null,
    qr_code: null,
    created_at: now,
    updated_at: now,
    confirmed_deposit_at: null,
    confirmed_delivery_at: null,
    refused_at: null,
    refused_reason: null,
    cancelled_at: null,
    cancelled_by: null,
    cancelled_reason: null,
    ...overrides,
  }
}

/**
 * Crée une réservation en attente d'approbation
 */
export function createMockPendingBooking(
  overrides?: Partial<MockBooking>
): MockBooking {
  return createMockBooking({
    status: 'pending',
    ...overrides,
  })
}

/**
 * Crée une réservation acceptée
 */
export function createMockAcceptedBooking(
  overrides?: Partial<MockBooking>
): MockBooking {
  return createMockBooking({
    status: 'accepted',
    ...overrides,
  })
}

/**
 * Crée une réservation payée
 */
export function createMockPaidBooking(
  overrides?: Partial<MockBooking>
): MockBooking {
  return createMockBooking({
    status: 'paid',
    tracking_code: faker.string.alphanumeric(10).toUpperCase(),
    qr_code: `SENDBOX-${faker.string.alphanumeric(8).toLowerCase()}-${faker.string.alphanumeric(4).toLowerCase()}`,
    ...overrides,
  })
}

/**
 * Crée une réservation en transit
 */
export function createMockInTransitBooking(
  overrides?: Partial<MockBooking>
): MockBooking {
  const now = new Date().toISOString()

  return createMockBooking({
    status: 'in_transit',
    tracking_code: faker.string.alphanumeric(10).toUpperCase(),
    deposit_proof_url: faker.image.url(),
    confirmed_deposit_at: now,
    qr_code: `SENDBOX-${faker.string.alphanumeric(8).toLowerCase()}-${faker.string.alphanumeric(4).toLowerCase()}`,
    ...overrides,
  })
}

/**
 * Crée une réservation livrée
 */
export function createMockDeliveredBooking(
  overrides?: Partial<MockBooking>
): MockBooking {
  const now = new Date().toISOString()

  return createMockBooking({
    status: 'delivered',
    tracking_code: faker.string.alphanumeric(10).toUpperCase(),
    deposit_proof_url: faker.image.url(),
    delivery_proof_url: faker.image.url(),
    confirmed_deposit_at: now,
    confirmed_delivery_at: now,
    qr_code: `SENDBOX-${faker.string.alphanumeric(8).toLowerCase()}-${faker.string.alphanumeric(4).toLowerCase()}`,
    ...overrides,
  })
}

/**
 * Crée une réservation annulée
 */
export function createMockCancelledBooking(
  overrides?: Partial<MockBooking>
): MockBooking {
  return createMockBooking({
    status: 'cancelled',
    ...overrides,
  })
}

/**
 * Crée plusieurs réservations de test
 */
export function createMockBookings(
  count: number,
  overrides?: Partial<MockBooking>
): MockBooking[] {
  return Array.from({ length: count }, () => createMockBooking(overrides))
}
