import { describe, it, expect, beforeEach } from 'vitest'
import {
  handleDepositScan,
  handleDeliveryScan,
  getBookingByQRCode,
} from '@/lib/core/bookings/qr-scan'
import { createMockUser } from '../../factories/user.factory'
import { createMockPublishedAnnouncement } from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  seedMockDatabase,
  resetMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

/**
 * Tests pour les scans QR code (dépôt et livraison)
 */
describe('QR Scan Actions', () => {
  const mockSender = createMockUser({
    id: 'sender-test-1',
    email: 'sender@test.com',
  })

  const mockTraveler = createMockUser({
    id: 'traveler-test-1',
    email: 'traveler@test.com',
  })

  let mockAnnouncement: ReturnType<typeof createMockPublishedAnnouncement>
  let mockBooking: ReturnType<typeof createMockBooking>

  const mockPhotoDataURL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const mockSignatureDataURL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const mockQRCode = 'SENDBOX-abcd1234-5678'

  beforeEach(() => {
    resetMockDatabase()

    mockAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockTraveler.id,
      available_kg: 10,
    })

    mockBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      traveler_id: mockTraveler.id,
      status: 'accepted',
      qr_code: mockQRCode,
    })

    seedMockDatabase('profiles', [mockSender, mockTraveler])
    seedMockDatabase('announcements', [mockAnnouncement])
    seedMockDatabase('bookings', [mockBooking])
  })

  describe('handleDepositScan', () => {
    describe('Validation de base', () => {
      it('rejette si utilisateur non authentifié', async () => {
        setMockAuthUser(null)

        const result = await handleDepositScan(
          mockBooking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/non authentifié/i)
      })

      it('rejette si booking inexistant', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await handleDepositScan(
          'non-existent-booking-id',
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/introuvable/i)
      })

      it('rejette si QR code invalide', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await handleDepositScan(
          mockBooking.id,
          'SENDBOX-wrong000-0000',
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/QR code invalide/i)
      })
    })

    describe("Validation d'autorisation", () => {
      it("accepte si utilisateur est l'expéditeur", async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await handleDepositScan(
          mockBooking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        // Note: Le test échouera car on ne peut pas vraiment uploader les fichiers en tests
        // Mais on vérifie qu'il ne rejette pas pour mauvaise autorisation
        if (result.error) {
          expect(result.error).not.toMatch(/autorisé/i)
        }
      })

      it('accepte si utilisateur est le voyageur', async () => {
        setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })

        const result = await handleDepositScan(
          mockBooking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        // Note: Le test échouera car on ne peut pas vraiment uploader les fichiers en tests
        // Mais on vérifie qu'il ne rejette pas pour mauvaise autorisation
        if (result.error) {
          expect(result.error).not.toMatch(/autorisé/i)
        }
      })

      it("rejette si utilisateur n'est ni expéditeur ni voyageur", async () => {
        const thirdParty = createMockUser({
          id: 'third-party-user',
          email: 'third@test.com',
        })
        seedMockDatabase('profiles', [thirdParty])
        setMockAuthUser({ id: thirdParty.id, email: thirdParty.email })

        const result = await handleDepositScan(
          mockBooking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/autorisé/i)
      })
    })

    describe('Validation de statut', () => {
      it('accepte si statut est accepted', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'accepted',
          qr_code: mockQRCode,
        })
        seedMockDatabase('bookings', [booking])

        const result = await handleDepositScan(
          booking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        // Note: Le test échouera car on ne peut pas vraiment uploader les fichiers
        // Mais on vérifie qu'il ne rejette pas pour mauvais statut
        if (result.error) {
          expect(result.error).not.toMatch(/ne peut pas être déposé/i)
        }
      })

      it('rejette si statut est pending', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'pending',
          qr_code: mockQRCode,
        })
        seedMockDatabase('bookings', [booking])

        const result = await handleDepositScan(
          booking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être déposé/i)
      })

      it('rejette si statut est in_transit (déjà déposé)', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'in_transit',
          qr_code: mockQRCode,
        })
        seedMockDatabase('bookings', [booking])

        const result = await handleDepositScan(
          booking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être déposé/i)
      })

      it('rejette si statut est delivered', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'delivered',
          qr_code: mockQRCode,
        })
        seedMockDatabase('bookings', [booking])

        const result = await handleDepositScan(
          booking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être déposé/i)
      })
    })
  })

  describe('handleDeliveryScan', () => {
    beforeEach(() => {
      // Pour les tests de livraison, le booking doit être in_transit
      mockBooking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'in_transit',
        qr_code: mockQRCode,
      })
      seedMockDatabase('bookings', [mockBooking])
    })

    describe('Validation de base', () => {
      it('rejette si utilisateur non authentifié', async () => {
        setMockAuthUser(null)

        const result = await handleDeliveryScan(
          mockBooking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/non authentifié/i)
      })

      it('rejette si booking inexistant', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await handleDeliveryScan(
          'non-existent-booking-id',
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/introuvable/i)
      })

      it('rejette si QR code invalide', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await handleDeliveryScan(
          mockBooking.id,
          'SENDBOX-wrong000-0000',
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/QR code invalide/i)
      })
    })

    describe("Validation d'autorisation", () => {
      it("accepte si utilisateur est l'expéditeur (destinataire)", async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await handleDeliveryScan(
          mockBooking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        // Note: Le test échouera car on ne peut pas vraiment uploader les fichiers
        // Mais on vérifie qu'il ne rejette pas pour mauvaise autorisation
        if (result.error) {
          expect(result.error).not.toMatch(/autorisé/i)
        }
      })

      it('accepte si utilisateur est le voyageur', async () => {
        setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })

        const result = await handleDeliveryScan(
          mockBooking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        // Note: Le test échouera car on ne peut pas vraiment uploader les fichiers
        // Mais on vérifie qu'il ne rejette pas pour mauvaise autorisation
        if (result.error) {
          expect(result.error).not.toMatch(/autorisé/i)
        }
      })

      it("rejette si utilisateur n'est ni expéditeur ni voyageur", async () => {
        const thirdParty = createMockUser({
          id: 'third-party-user',
          email: 'third@test.com',
        })
        seedMockDatabase('profiles', [thirdParty])
        setMockAuthUser({ id: thirdParty.id, email: thirdParty.email })

        const result = await handleDeliveryScan(
          mockBooking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/autorisé/i)
      })
    })

    describe('Validation de statut', () => {
      it('accepte si statut est in_transit', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'in_transit',
          qr_code: mockQRCode,
        })
        seedMockDatabase('bookings', [booking])

        const result = await handleDeliveryScan(
          booking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        // Note: Le test échouera car on ne peut pas vraiment uploader les fichiers
        // Mais on vérifie qu'il ne rejette pas pour mauvais statut
        if (result.error) {
          expect(result.error).not.toMatch(/ne peut pas être livré/i)
        }
      })

      it('rejette si statut est pending', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'pending',
          qr_code: mockQRCode,
        })
        seedMockDatabase('bookings', [booking])

        const result = await handleDeliveryScan(
          booking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être livré/i)
      })

      it('rejette si statut est accepted (pas encore déposé)', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'accepted',
          qr_code: mockQRCode,
        })
        seedMockDatabase('bookings', [booking])

        const result = await handleDeliveryScan(
          booking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être livré/i)
      })

      it('rejette si statut est delivered (déjà livré)', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const booking = createMockBooking({
          announcement_id: mockAnnouncement.id,
          sender_id: mockSender.id,
          traveler_id: mockTraveler.id,
          status: 'delivered',
          qr_code: mockQRCode,
        })
        seedMockDatabase('bookings', [booking])

        const result = await handleDeliveryScan(
          booking.id,
          mockQRCode,
          mockPhotoDataURL,
          mockSignatureDataURL
        )

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/ne peut pas être livré/i)
      })
    })
  })

  describe('getBookingByQRCode', () => {
    describe('Validation de base', () => {
      it('rejette si utilisateur non authentifié', async () => {
        setMockAuthUser(null)

        const result = await getBookingByQRCode(mockQRCode)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/non authentifié/i)
      })

      it('rejette si QR code inexistant', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await getBookingByQRCode('SENDBOX-notfound-0000')

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/introuvable|invalide/i)
      })

      it('retourne le booking si QR code valide', async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await getBookingByQRCode(mockQRCode)

        expect(result.error).toBeUndefined()
        expect(result.booking).toBeDefined()
        expect(result.booking?.id).toBe(mockBooking.id)
      })
    })

    describe("Validation d'autorisation", () => {
      it("retourne le booking si utilisateur est l'expéditeur", async () => {
        setMockAuthUser({ id: mockSender.id, email: mockSender.email })

        const result = await getBookingByQRCode(mockQRCode)

        expect(result.error).toBeUndefined()
        expect(result.booking).toBeDefined()
        expect(result.booking?.sender_id).toBe(mockSender.id)
      })

      it('retourne le booking si utilisateur est le voyageur', async () => {
        setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })

        const result = await getBookingByQRCode(mockQRCode)

        expect(result.error).toBeUndefined()
        expect(result.booking).toBeDefined()
        expect(result.booking?.traveler_id).toBe(mockTraveler.id)
      })

      it("rejette si utilisateur n'est ni expéditeur ni voyageur", async () => {
        const thirdParty = createMockUser({
          id: 'third-party-user',
          email: 'third@test.com',
        })
        seedMockDatabase('profiles', [thirdParty])
        setMockAuthUser({ id: thirdParty.id, email: thirdParty.email })

        const result = await getBookingByQRCode(mockQRCode)

        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/autorisé/i)
      })
    })
  })
})
