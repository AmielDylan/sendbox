import { describe, it, expect, beforeEach } from 'vitest'
import { refuseBooking } from '@/lib/core/bookings/requests'
import { createMockUser } from '../../factories/user.factory'
import { createMockPublishedAnnouncement } from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  seedMockDatabase,
  resetMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

/**
 * Tests pour le refus de réservations (refuseBooking)
 */
describe('refuseBooking', () => {
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

  it('refuse une réservation avec une raison valide', async () => {
    const result = await refuseBooking(
      mockBooking.id,
      'Dates non compatibles avec mon voyage'
    )

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(result.message).toMatch(/refusée/i)
  })

  it('rejette si utilisateur non authentifié', async () => {
    setMockAuthUser(null)

    const result = await refuseBooking(mockBooking.id, 'Raison valide ici')

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/vous devez être connecté/i)
  })

  it("rejette si l'utilisateur n'est pas le voyageur de l'annonce", async () => {
    // Authenticate as sender instead of traveler
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })

    const result = await refuseBooking(mockBooking.id, 'Raison valide ici')

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/vous n'êtes pas autorisé/i)
  })

  it('rejette si booking inexistant', async () => {
    const result = await refuseBooking(
      'non-existent-booking-id',
      'Raison valide ici'
    )

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/demande introuvable/i)
  })

  it("rejette si le booking n'est pas en statut pending", async () => {
    const acceptedBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      status: 'accepted',
      kilos_requested: 5,
    })

    seedMockDatabase('bookings', [acceptedBooking])

    const result = await refuseBooking(acceptedBooking.id, 'Raison valide ici')

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/n'est plus en attente/i)
  })

  it('rejette si raison vide', async () => {
    const result = await refuseBooking(mockBooking.id, '')

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/raison de refus/i)
    expect(result.error).toMatch(/minimum 5 caractères/i)
  })

  it('rejette si raison trop courte (moins de 5 caractères)', async () => {
    const result = await refuseBooking(mockBooking.id, 'test')

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/minimum 5 caractères/i)
  })

  it('rejette si raison contient uniquement des espaces', async () => {
    const result = await refuseBooking(mockBooking.id, '     ')

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/minimum 5 caractères/i)
  })

  it('accepte raison exactement 5 caractères', async () => {
    const result = await refuseBooking(mockBooking.id, '12345')

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
  })

  it('accepte raison avec espaces autour (trim)', async () => {
    const result = await refuseBooking(
      mockBooking.id,
      '  Raison valide avec espaces  '
    )

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
  })

  it('accepte raison longue', async () => {
    const longReason =
      "Je refuse cette demande car les dates ne correspondent pas à mon planning de voyage. De plus, le poids demandé est trop important pour l'espace disponible dans ma valise."

    const result = await refuseBooking(mockBooking.id, longReason)

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
  })

  it('refuse plusieurs réservations sur la même annonce', async () => {
    const secondBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: 'another-sender-id',
      status: 'pending',
      kilos_requested: 3,
    })

    seedMockDatabase('bookings', [mockBooking, secondBooking])

    // Refuse first booking
    const result1 = await refuseBooking(mockBooking.id, 'Raison première')
    expect(result1.success).toBe(true)

    // Refuse second booking
    const result2 = await refuseBooking(secondBooking.id, 'Raison seconde')
    expect(result2.success).toBe(true)
  })
})
