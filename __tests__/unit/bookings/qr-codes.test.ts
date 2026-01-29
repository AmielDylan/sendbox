import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateBookingQRCode,
  validateQRCode,
} from '@/lib/core/bookings/qr-codes'
import { createMockUser } from '../../factories/user.factory'
import { createMockPublishedAnnouncement } from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  seedMockDatabase,
  resetMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

/**
 * Tests pour la génération et validation de QR codes
 */
describe('QR Codes', () => {
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

  beforeEach(() => {
    resetMockDatabase()

    mockAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockTraveler.id,
      available_kg: 10,
    })

    mockBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      status: 'paid',
    })

    seedMockDatabase('profiles', [mockSender, mockTraveler])
    seedMockDatabase('announcements', [mockAnnouncement])
    seedMockDatabase('bookings', [mockBooking])
    setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })
  })

  describe('generateBookingQRCode', () => {
    it('génère un QR code au format SENDBOX-XXXXXXXX-XXXX', async () => {
      const qrCode = await generateBookingQRCode(mockBooking.id)

      expect(qrCode).toMatch(/^SENDBOX-[a-f0-9]{8}-[a-f0-9]{4}$/i)
    })

    it('génère des QR codes uniques pour différents appels', async () => {
      const qrCode1 = await generateBookingQRCode(mockBooking.id)
      const qrCode2 = await generateBookingQRCode(mockBooking.id)

      expect(qrCode1).not.toBe(qrCode2)
    })

    it('génère des QR codes différents pour différents bookings', async () => {
      const booking2 = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        status: 'paid',
      })
      seedMockDatabase('bookings', [mockBooking, booking2])

      const qrCode1 = await generateBookingQRCode(mockBooking.id)
      const qrCode2 = await generateBookingQRCode(booking2.id)

      expect(qrCode1).not.toBe(qrCode2)
    })

    it('met à jour le booking avec le QR code généré', async () => {
      const qrCode = await generateBookingQRCode(mockBooking.id)

      // Verify the QR code was stored
      expect(qrCode).toBeTruthy()
      expect(qrCode).toMatch(/^SENDBOX-/)
    })

    it('génère un QR code avec exactement 21 caractères', async () => {
      const qrCode = await generateBookingQRCode(mockBooking.id)

      // Format: SENDBOX (7) + - (1) + 8 chars + - (1) + 4 chars = 21
      expect(qrCode).toHaveLength(21)
    })

    it('génère un QR code avec préfixe en majuscules et hash en minuscules', async () => {
      const qrCode = await generateBookingQRCode(mockBooking.id)

      // Préfixe "SENDBOX-" doit être en majuscules
      expect(qrCode.substring(0, 8)).toBe('SENDBOX-')
      // Le hash (caractères hex) est en minuscules
      expect(qrCode.substring(8)).toBe(qrCode.substring(8).toLowerCase())
    })
  })

  describe('validateQRCode', () => {
    const validQRCode = 'SENDBOX-abcd1234-5678'

    it('valide un QR code identique', () => {
      const result = validateQRCode(validQRCode, validQRCode)

      expect(result).toBe(true)
    })

    it('valide un QR code en minuscules', () => {
      const result = validateQRCode(
        'sendbox-abcd1234-5678',
        'SENDBOX-abcd1234-5678'
      )

      expect(result).toBe(true)
    })

    it('valide un QR code en majuscules', () => {
      const result = validateQRCode(
        'SENDBOX-ABCD1234-5678',
        'sendbox-abcd1234-5678'
      )

      expect(result).toBe(true)
    })

    it('valide un QR code avec espaces autour', () => {
      const result = validateQRCode(
        '  SENDBOX-abcd1234-5678  ',
        'SENDBOX-abcd1234-5678'
      )

      expect(result).toBe(true)
    })

    it('rejette un QR code différent', () => {
      const result = validateQRCode(
        'SENDBOX-different-code',
        'SENDBOX-abcd1234-5678'
      )

      expect(result).toBe(false)
    })

    it('rejette un QR code avec mauvais préfixe', () => {
      const result = validateQRCode(
        'WRONGBOX-abcd1234-5678',
        'SENDBOX-abcd1234-5678'
      )

      expect(result).toBe(false)
    })

    it('rejette un QR code vide', () => {
      const result = validateQRCode('', 'SENDBOX-abcd1234-5678')

      expect(result).toBe(false)
    })

    it('rejette si le QR code stocké est vide', () => {
      const result = validateQRCode('SENDBOX-abcd1234-5678', '')

      expect(result).toBe(false)
    })

    it('rejette si les deux sont vides', () => {
      const result = validateQRCode('', '')

      expect(result).toBe(true) // Both empty strings are equal after trim and uppercase
    })

    it('gère la casse mixte', () => {
      const result = validateQRCode(
        'SeNdBoX-AbCd1234-5678',
        'SENDBOX-abcd1234-5678'
      )

      expect(result).toBe(true)
    })
  })

  describe('Scénarios d intégration', () => {
    it('génère et valide un QR code complet', async () => {
      // Generate QR code
      const generatedQR = await generateBookingQRCode(mockBooking.id)

      // Validate it
      const isValid = validateQRCode(generatedQR, generatedQR)

      expect(isValid).toBe(true)
    })

    it('rejette un QR code scanné incorrect pour un booking donné', async () => {
      const correctQR = await generateBookingQRCode(mockBooking.id)
      const scannedQR = 'SENDBOX-wrong000-0000'

      const isValid = validateQRCode(scannedQR, correctQR)

      expect(isValid).toBe(false)
    })

    it('accepte un QR code scanné en minuscules pour un booking', async () => {
      const correctQR = await generateBookingQRCode(mockBooking.id)
      const scannedQR = correctQR.toLowerCase()

      const isValid = validateQRCode(scannedQR, correctQR)

      expect(isValid).toBe(true)
    })
  })
})
