import { describe, it, expect, beforeEach } from 'vitest'
import { acceptBooking } from '@/lib/core/bookings/requests'
import { createMockUser } from '../../factories/user.factory'
import {
  createMockPublishedAnnouncement,
  createMockAnnouncement,
} from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  seedMockDatabase,
  resetMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

/**
 * Tests pour l'acceptation de réservations (acceptBooking)
 */
describe('acceptBooking', () => {
  const mockSender = createMockUser({
    id: 'sender-test-1',
    email: 'sender@test.com',
    role: 'sender',
    kyc_status: 'approved',
  })

  const mockTraveler = createMockUser({
    id: 'traveler-test-1',
    email: 'traveler@test.com',
    role: 'traveler',
    kyc_status: 'approved',
  })

  let mockAnnouncement: ReturnType<typeof createMockPublishedAnnouncement>
  let mockBooking: ReturnType<typeof createMockBooking>

  beforeEach(() => {
    resetMockDatabase()

    // Create fresh announcement for each test
    mockAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockTraveler.id,
      available_kg: 10,
      status: 'active' as any,
    })

    // Create pending booking for the announcement
    mockBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      status: 'pending',
      kilos_requested: 5,
    })

    // Seed the mock database
    seedMockDatabase('profiles', [mockSender, mockTraveler])
    seedMockDatabase('announcements', [mockAnnouncement])
    seedMockDatabase('bookings', [mockBooking])

    // Set the authenticated user to mockTraveler by default
    setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })
  })

  it('accepte une réservation avec KYC approuvé', async () => {
    const result = await acceptBooking(mockBooking.id)

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(result.message).toMatch(/acceptée avec succès/i)
  })

  it('rejette si utilisateur non authentifié', async () => {
    setMockAuthUser(null)

    const result = await acceptBooking(mockBooking.id)

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/vous devez être connecté/i)
  })

  it("rejette si l'utilisateur n'est pas le voyageur de l'annonce", async () => {
    // Authenticate as sender instead of traveler
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })

    const result = await acceptBooking(mockBooking.id)

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/vous n'êtes pas autorisé/i)
  })

  it('rejette si booking inexistant', async () => {
    const result = await acceptBooking('non-existent-booking-id')

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/demande introuvable/i)
  })

  it('rejette si KYC non approuvé (pending)', async () => {
    const travelerPendingKYC = createMockUser({
      id: 'traveler-pending-1',
      email: 'traveler-pending@test.com',
      kyc_status: 'pending',
    })

    const announcement = createMockPublishedAnnouncement({
      traveler_id: travelerPendingKYC.id,
      available_kg: 10,
    })

    const booking = createMockBooking({
      announcement_id: announcement.id,
      sender_id: mockSender.id,
      status: 'pending',
      kilos_requested: 5,
    })

    seedMockDatabase('profiles', [travelerPendingKYC])
    seedMockDatabase('announcements', [announcement])
    seedMockDatabase('bookings', [booking])
    setMockAuthUser({
      id: travelerPendingKYC.id,
      email: travelerPendingKYC.email,
    })

    const result = await acceptBooking(booking.id)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kyc')
    expect(result.error).toMatch(/vérification en cours/i)
  })

  it('rejette si KYC non approuvé (incomplete)', async () => {
    const travelerIncompleteKYC = createMockUser({
      id: 'traveler-incomplete-1',
      email: 'traveler-incomplete@test.com',
      kyc_status: 'incomplete',
    })

    const announcement = createMockPublishedAnnouncement({
      traveler_id: travelerIncompleteKYC.id,
      available_kg: 10,
    })

    const booking = createMockBooking({
      announcement_id: announcement.id,
      sender_id: mockSender.id,
      status: 'pending',
      kilos_requested: 5,
    })

    seedMockDatabase('profiles', [travelerIncompleteKYC])
    seedMockDatabase('announcements', [announcement])
    seedMockDatabase('bookings', [booking])
    setMockAuthUser({
      id: travelerIncompleteKYC.id,
      email: travelerIncompleteKYC.email,
    })

    const result = await acceptBooking(booking.id)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kyc')
    expect(result.error).toMatch(/vérification d'identité incomplète/i)
  })

  it('rejette si KYC non approuvé (rejected)', async () => {
    const travelerRejectedKYC = createMockUser({
      id: 'traveler-rejected-1',
      email: 'traveler-rejected@test.com',
      kyc_status: 'rejected',
      kyc_rejection_reason: 'Documents invalides',
    })

    const announcement = createMockPublishedAnnouncement({
      traveler_id: travelerRejectedKYC.id,
      available_kg: 10,
    })

    const booking = createMockBooking({
      announcement_id: announcement.id,
      sender_id: mockSender.id,
      status: 'pending',
      kilos_requested: 5,
    })

    seedMockDatabase('profiles', [travelerRejectedKYC])
    seedMockDatabase('announcements', [announcement])
    seedMockDatabase('bookings', [booking])
    setMockAuthUser({
      id: travelerRejectedKYC.id,
      email: travelerRejectedKYC.email,
    })

    const result = await acceptBooking(booking.id)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kyc')
    expect(result.error).toMatch(/vérification refusée/i)
  })

  it("rejette si le booking n'est pas en statut pending", async () => {
    const acceptedBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      status: 'accepted',
      kilos_requested: 5,
    })

    seedMockDatabase('bookings', [acceptedBooking])

    const result = await acceptBooking(acceptedBooking.id)

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/n'est plus en attente/i)
  })

  it("rejette si l'annonce n'est pas active", async () => {
    const inactiveAnnouncement = createMockAnnouncement({
      traveler_id: mockTraveler.id,
      status: 'completed' as any,
      available_kg: 10,
    })

    const booking = createMockBooking({
      announcement_id: inactiveAnnouncement.id,
      sender_id: mockSender.id,
      status: 'pending',
      kilos_requested: 5,
    })

    seedMockDatabase('announcements', [inactiveAnnouncement])
    seedMockDatabase('bookings', [booking])

    const result = await acceptBooking(booking.id)

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/n'est plus disponible/i)
  })

  it('rejette si capacité insuffisante', async () => {
    // Add existing accepted booking that uses 8kg
    const existingBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: 'other-sender-id',
      status: 'accepted',
      kilos_requested: 8,
    })

    // New booking requests 5kg, but only 2kg remain (10kg - 8kg)
    const newBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      status: 'pending',
      kilos_requested: 5,
    })

    seedMockDatabase('bookings', [existingBooking, newBooking])

    const result = await acceptBooking(newBooking.id)

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/capacité insuffisante/i)
    expect(result.error).toMatch(/2.0 kg/i) // Should show remaining capacity
  })

  it('accepte si capacité exacte disponible', async () => {
    // Existing booking uses 5kg
    const existingBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: 'other-sender-id',
      status: 'accepted',
      kilos_requested: 5,
    })

    // New booking requests exactly the remaining 5kg (10kg - 5kg)
    const newBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      status: 'pending',
      kilos_requested: 5,
    })

    seedMockDatabase('bookings', [existingBooking, newBooking])

    const result = await acceptBooking(newBooking.id)

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
  })

  it('prend en compte tous les bookings confirmés dans le calcul de capacité', async () => {
    // Multiple existing bookings in different confirmed states
    const bookings = [
      createMockBooking({
        announcement_id: mockAnnouncement.id,
        status: 'accepted',
        kilos_requested: 2,
      }),
      createMockBooking({
        announcement_id: mockAnnouncement.id,
        status: 'paid',
        kilos_requested: 2,
      }),
      createMockBooking({
        announcement_id: mockAnnouncement.id,
        status: 'deposited',
        kilos_requested: 2,
      }),
      createMockBooking({
        announcement_id: mockAnnouncement.id,
        status: 'in_transit',
        kilos_requested: 2,
      }),
      // New booking requesting 3kg (only 2kg remain: 10 - 8)
      createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        status: 'pending',
        kilos_requested: 3,
      }),
    ]

    seedMockDatabase('bookings', bookings)

    const pendingBooking = bookings[bookings.length - 1]
    const result = await acceptBooking(pendingBooking.id)

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/capacité insuffisante/i)
  })

  it('ignore les bookings annulés dans le calcul de capacité', async () => {
    // Cancelled booking should not count towards reserved weight
    const cancelledBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      status: 'cancelled',
      kilos_requested: 8,
    })

    // New booking requests 5kg - should succeed because cancelled doesn't count
    const newBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      status: 'pending',
      kilos_requested: 5,
    })

    seedMockDatabase('bookings', [cancelledBooking, newBooking])

    const result = await acceptBooking(newBooking.id)

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
  })
})
