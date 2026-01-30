import { describe, it, expect, beforeEach } from 'vitest'
import { cancelBookingWithReason } from '@/lib/core/bookings/workflow'
import { createMockUser } from '../../factories/user.factory'
import { createMockPublishedAnnouncement } from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  seedMockDatabase,
  resetMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

/**
 * Tests pour l'annulation de réservations (cancelBookingWithReason)
 */
describe('cancelBookingWithReason', () => {
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

  beforeEach(() => {
    resetMockDatabase()

    mockAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockTraveler.id,
      available_kg: 10,
      status: 'active' as any,
    })

    seedMockDatabase('profiles', [mockSender, mockTraveler])
    seedMockDatabase('announcements', [mockAnnouncement])
  })

  describe('Annulation par expéditeur', () => {
    beforeEach(() => {
      setMockAuthUser({ id: mockSender.id, email: mockSender.email })
    })

    it('annule une réservation acceptée non payée', async () => {
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'accepted',
        paid_at: null,
      })
      seedMockDatabase('bookings', [booking])

      const result = await cancelBookingWithReason(
        booking.id,
        'Je ne peux plus envoyer ce colis'
      )

      expect(result.error).toBeUndefined()
      expect(result.success).toBe(true)
      expect(result.message).toMatch(/annulée/i)
    })

    it('rejette si réservation payée (réservé au voyageur)', async () => {
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      seedMockDatabase('bookings', [booking])

      const result = await cancelBookingWithReason(
        booking.id,
        'Je ne peux plus envoyer ce colis'
      )

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/ne peut pas être annulée à ce stade/i)
    })
  })

  describe('Annulation par voyageur', () => {
    beforeEach(() => {
      setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })
    })

    it('annule une réservation acceptée non payée', async () => {
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'accepted',
        paid_at: null,
      })
      seedMockDatabase('bookings', [booking])

      const result = await cancelBookingWithReason(
        booking.id,
        'Dates modifiées, voyage annulé'
      )

      expect(result.error).toBeUndefined()
      expect(result.success).toBe(true)
    })

    it('annule une réservation payée avec pénalité de réputation', async () => {
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      seedMockDatabase('bookings', [booking])

      const result = await cancelBookingWithReason(
        booking.id,
        'Voyage annulé par la compagnie'
      )

      expect(result.error).toBeUndefined()
      expect(result.success).toBe(true)
      // Note: La pénalité de réputation (-0.3) est appliquée côté serveur
    })
  })

  describe('Validation de raison', () => {
    let booking: ReturnType<typeof createMockBooking>

    beforeEach(() => {
      booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'accepted',
        paid_at: null,
      })
      seedMockDatabase('bookings', [booking])
      setMockAuthUser({ id: mockSender.id, email: mockSender.email })
    })

    it('rejette si raison vide', async () => {
      const result = await cancelBookingWithReason(booking.id, '')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/raison/i)
      expect(result.error).toMatch(/minimum 5 caractères/i)
    })

    it('rejette si raison trop courte (moins de 5 caractères)', async () => {
      const result = await cancelBookingWithReason(booking.id, 'non')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/minimum 5 caractères/i)
    })

    it('rejette si raison contient uniquement des espaces', async () => {
      const result = await cancelBookingWithReason(booking.id, '       ')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/minimum 5 caractères/i)
    })

    it('accepte raison exactement 5 caractères', async () => {
      const result = await cancelBookingWithReason(booking.id, 'annul')

      expect(result.error).toBeUndefined()
      expect(result.success).toBe(true)
    })

    it('accepte raison avec espaces autour (trim)', async () => {
      const result = await cancelBookingWithReason(
        booking.id,
        '  Raison valide ici  '
      )

      expect(result.error).toBeUndefined()
      expect(result.success).toBe(true)
    })
  })

  describe('Validation d authentification et d autorisation', () => {
    let booking: ReturnType<typeof createMockBooking>

    beforeEach(() => {
      booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'accepted',
        paid_at: null,
      })
      seedMockDatabase('bookings', [booking])
    })

    it('rejette si utilisateur non authentifié', async () => {
      setMockAuthUser(null)

      const result = await cancelBookingWithReason(booking.id, 'Raison valide')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/vous devez être connecté/i)
    })

    it("rejette si utilisateur n'est ni l'expéditeur ni le voyageur", async () => {
      const thirdPartyUser = createMockUser({
        id: 'third-party-user',
        email: 'third@test.com',
      })
      seedMockDatabase('profiles', [thirdPartyUser])
      setMockAuthUser({ id: thirdPartyUser.id, email: thirdPartyUser.email })

      const result = await cancelBookingWithReason(booking.id, 'Raison valide')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/vous n'êtes pas autorisé/i)
    })

    it('rejette si booking inexistant', async () => {
      setMockAuthUser({ id: mockSender.id, email: mockSender.email })

      const result = await cancelBookingWithReason(
        'non-existent-booking-id',
        'Raison valide'
      )

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/introuvable/i)
    })
  })

  describe('Validation de statut', () => {
    beforeEach(() => {
      setMockAuthUser({ id: mockSender.id, email: mockSender.email })
    })

    it('rejette si réservation en statut pending', async () => {
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'pending',
      })
      seedMockDatabase('bookings', [booking])

      const result = await cancelBookingWithReason(booking.id, 'Raison valide')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/ne peut pas être annulée à ce stade/i)
    })

    it('rejette si réservation en statut in_transit', async () => {
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'in_transit',
        paid_at: new Date().toISOString(),
      })
      seedMockDatabase('bookings', [booking])

      const result = await cancelBookingWithReason(booking.id, 'Raison valide')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/ne peut pas être annulée à ce stade/i)
    })

    it('rejette si réservation en statut delivered', async () => {
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'delivered',
        paid_at: new Date().toISOString(),
      })
      seedMockDatabase('bookings', [booking])

      const result = await cancelBookingWithReason(booking.id, 'Raison valide')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/ne peut pas être annulée à ce stade/i)
    })

    it('rejette si réservation déjà cancelled', async () => {
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'cancelled',
      })
      seedMockDatabase('bookings', [booking])

      const result = await cancelBookingWithReason(booking.id, 'Raison valide')

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/ne peut pas être annulée à ce stade/i)
    })
  })
})
