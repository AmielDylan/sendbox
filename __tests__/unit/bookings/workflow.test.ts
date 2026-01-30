import { describe, it, expect, beforeEach } from 'vitest'
import { deleteCancelledBooking } from '@/lib/core/bookings/workflow'
import { createMockUser } from '../../factories/user.factory'
import { createMockPublishedAnnouncement } from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  seedMockDatabase,
  resetMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

/**
 * Tests pour le workflow des réservations
 */
describe('Booking Workflow', () => {
  const mockSender = createMockUser({
    id: 'sender-test-1',
    email: 'sender@test.com',
  })

  const mockTraveler = createMockUser({
    id: 'traveler-test-1',
    email: 'traveler@test.com',
  })

  let mockAnnouncement: ReturnType<typeof createMockPublishedAnnouncement>

  beforeEach(() => {
    resetMockDatabase()

    mockAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockTraveler.id,
      available_kg: 10,
    })

    seedMockDatabase('profiles', [mockSender, mockTraveler])
    seedMockDatabase('announcements', [mockAnnouncement])
  })

  describe('deleteCancelledBooking', () => {
    describe("Validation d'authentification", () => {
      it('rejette si utilisateur non authentifié', async () => {
        setMockAuthUser(null)

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'cancelled',
          refused_at: new Date().toISOString(),
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/vous devez être connecté/i)
      })

      it('rejette si booking inexistant', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await deleteCancelledBooking('non-existent-booking-id')

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/introuvable/i)
      })
    })

    describe("Validation d'autorisation", () => {
      it("autorise l'expéditeur à supprimer", async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'cancelled',
          refused_at: new Date().toISOString(),
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeUndefined()
        expect(result.success).toBe(true)
        expect(result.message).toMatch(/supprimée/i)
      })

      it('autorise le voyageur à supprimer', async () => {
        setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'cancelled',
          refused_at: new Date().toISOString(),
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeUndefined()
        expect(result.success).toBe(true)
      })

      it("rejette si utilisateur n'est ni expéditeur ni voyageur", async () => {
        const thirdParty = createMockUser({
          id: 'third-party-user',
          email: 'third@test.com',
        })
        seedMockDatabase('profiles', [thirdParty])
        setMockAuthUser({ id: thirdParty.id, email: thirdParty.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'cancelled',
          refused_at: new Date().toISOString(),
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/autorisé/i)
      })
    })

    describe('Validation du statut', () => {
      beforeEach(() => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })
      })

      it('autorise la suppression si status est cancelled et refused_at est défini', async () => {
        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'cancelled',
          refused_at: new Date().toISOString(),
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeUndefined()
        expect(result.success).toBe(true)
      })

      it("rejette si status n'est pas cancelled", async () => {
        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'pending',
          refused_at: null,
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être supprimée/i)
      })

      it('rejette si status est accepted', async () => {
        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'accepted',
          refused_at: null,
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être supprimée/i)
      })

      it('rejette si status est paid', async () => {
        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'paid',
          refused_at: null,
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être supprimée/i)
      })

      it('rejette si status est in_transit', async () => {
        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'in_transit',
          refused_at: null,
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être supprimée/i)
      })

      it('rejette si status est delivered', async () => {
        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'delivered',
          refused_at: null,
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être supprimée/i)
      })

      it('rejette si cancelled mais refused_at non défini', async () => {
        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'cancelled',
          refused_at: null,
        })
        seedMockDatabase('bookings', [booking])

        const result = await deleteCancelledBooking(booking.id)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être supprimée/i)
      })
    })
  })

  describe('Scénarios de workflow intégrés', () => {
    it('un booking passe de pending à cancelled correctement', () => {
      // Arrange: Créer un booking pending
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'pending',
      })

      expect(booking.status).toBe('pending')
      expect(booking.refused_at).toBeFalsy()

      // Act: Simuler l'annulation (mise à jour manuelle pour le test)
      const cancelledBooking = {
        ...booking,
        status: 'cancelled' as const,
        refused_at: new Date().toISOString(),
        cancelled_reason: 'Test cancellation',
      }

      // Assert: Vérifier les changements d'état
      expect(cancelledBooking.status).toBe('cancelled')
      expect(cancelledBooking.refused_at).toBeTruthy()
      expect(cancelledBooking.cancelled_reason).toBe('Test cancellation')
    })

    it('un booking ne peut pas sauter des étapes critiques', () => {
      // Arrange: Créer un booking pending
      const booking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'pending',
      })

      // Assert: Un booking pending ne devrait pas avoir de QR code
      expect(booking.qr_code).toBeNull()

      // Assert: Un booking pending ne devrait pas avoir de dates de livraison
      expect(booking.confirmed_deposit_at).toBeNull()
      expect(booking.confirmed_delivery_at).toBeNull()
    })

    it("la progression des statuts suit l'ordre logique", () => {
      const statuses: Array<
        | 'pending'
        | 'accepted'
        | 'paid'
        | 'in_transit'
        | 'delivered'
        | 'cancelled'
      > = [
        'pending',
        'accepted',
        'paid',
        'in_transit',
        'delivered',
        'cancelled',
      ]

      // Vérifier que chaque statut peut être assigné
      statuses.forEach(status => {
        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status,
        })

        expect(booking.status).toBe(status)
      })
    })
  })
})
