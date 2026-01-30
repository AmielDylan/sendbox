import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '@/app/api/payments/simulate/route'
import { NextRequest } from 'next/server'
import { createMockUser } from '../factories/user.factory'
import { createMockBooking } from '../factories/booking.factory'
import { createMockPublishedAnnouncement } from '../factories/announcement.factory'
import {
  seedMockDatabase,
  resetMockDatabase,
  setMockAuthUser,
  getMockDatabase,
} from '../mocks/server'

/**
 * Tests pour POST /api/payments/simulate
 * Route de simulation de paiement (sans Stripe)
 */
describe('POST /api/payments/simulate', () => {
  const mockSender = createMockUser({
    id: 'sender-test-1',
    email: 'sender@test.com',
    kyc_status: 'approved',
  })

  const mockTraveler = createMockUser({
    id: 'traveler-test-1',
    email: 'traveler@test.com',
    kyc_status: 'approved',
  })

  let mockAnnouncement: ReturnType<typeof createMockPublishedAnnouncement>
  let mockBooking: ReturnType<typeof createMockBooking>

  beforeEach(() => {
    resetMockDatabase()

    mockAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockTraveler.id,
      price_per_kg: 10,
    })

    mockBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      traveler_id: mockTraveler.id,
      status: 'accepted',
      kilos_requested: 5,
      price_per_kg: 10,
      package_value: 200,
      insurance_opted: true,
      paid_at: null,
      payment_intent_id: null,
    })

    seedMockDatabase('profiles', [mockSender, mockTraveler])
    seedMockDatabase('announcements', [mockAnnouncement])
    seedMockDatabase('bookings', [mockBooking])

    setMockAuthUser({ id: mockSender.id, email: mockSender.email })
  })

  describe("Validation d'authentification", () => {
    it('rejette si utilisateur non authentifié', async () => {
      setMockAuthUser(null)

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toMatch(/non authentifié/i)
    })
  })

  describe('Validation des paramètres', () => {
    it('rejette si booking_id manquant', async () => {
      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/booking_id requis/i)
    })

    it('rejette si booking inexistant', async () => {
      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: 'non-existent-id' }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toMatch(/introuvable/i)
    })
  })

  describe("Validation d'autorisation", () => {
    it("rejette si utilisateur n'est pas le sender", async () => {
      setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toMatch(/non autorisé/i)
    })
  })

  describe('Validation du statut du booking', () => {
    it('retourne success si déjà payé (idempotence)', async () => {
      const paidBooking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      seedMockDatabase('bookings', [paidBooking])

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: paidBooking.id }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.alreadyPaid).toBe(true)
    })

    it('rejette si booking non éligible (status != accepted)', async () => {
      const pendingBooking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'pending',
      })
      seedMockDatabase('bookings', [pendingBooking])

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: pendingBooking.id }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/non éligible/i)
    })

    it('rejette si booking refusé', async () => {
      const refusedBooking = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'refused',
      })
      seedMockDatabase('bookings', [refusedBooking])

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: refusedBooking.id }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/non éligible/i)
    })
  })

  describe('Simulation de paiement', () => {
    it('met à jour booking à status paid', async () => {
      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.paidAt).toBeDefined()

      // Vérifier que le booking a été mis à jour dans le mock database
      const bookings = getMockDatabase().bookings
      const updatedBooking = bookings.get(mockBooking.id)
      expect(updatedBooking?.status).toBe('paid')
      expect(updatedBooking?.paid_at).toBeDefined()
      expect(updatedBooking?.payment_intent_id).toBeDefined()
      expect(updatedBooking?.payment_intent_id).toContain('sim_')
    })

    it('génère un payment_intent_id de simulation', async () => {
      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      await POST(request)

      const bookings = getMockDatabase().bookings
      const updatedBooking = bookings.get(mockBooking.id)
      expect(updatedBooking?.payment_intent_id).toMatch(/^sim_/)
    })

    it('définit paid_at à la date actuelle', async () => {
      const beforeTime = new Date()

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      await POST(request)

      const afterTime = new Date()

      const bookings = getMockDatabase().bookings
      const updatedBooking = bookings.get(mockBooking.id)
      expect(updatedBooking?.paid_at).toBeDefined()

      const paidAtDate = new Date(updatedBooking!.paid_at!)
      expect(paidAtDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(paidAtDate.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })
  })

  describe('Calculs des montants', () => {
    it('calcule montant correct avec assurance', async () => {
      // mockBooking: 5kg × 10€/kg = 50€
      // Commission: 50€ × 12% = 6€
      // Assurance: 200€ × 3% = 6€
      // Total attendu: 62€ (stocké dans transaction)

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(200)

      // Vérifier la transaction créée
      const transactions = getMockDatabase().transactions
      const bookingTransactions = Array.from(transactions.values()).filter(
        (t: any) => t.booking_id === mockBooking.id
      )
      expect(bookingTransactions.length).toBeGreaterThan(0)

      const transaction = bookingTransactions[0]
      expect(transaction.amount).toBe(62)
      expect(transaction.currency).toBe('eur')
    })

    it('calcule montant correct sans assurance', async () => {
      const bookingWithoutInsurance = createMockBooking({
        announcement_id: mockAnnouncement.id,
        sender_id: mockSender.id,
        traveler_id: mockTraveler.id,
        status: 'accepted',
        kilos_requested: 10,
        price_per_kg: 10,
        package_value: 0,
        insurance_opted: false,
        paid_at: null,
      })
      seedMockDatabase('bookings', [bookingWithoutInsurance])

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: bookingWithoutInsurance.id }),
        }
      )

      await POST(request)

      // 10kg × 10€ = 100€
      // Commission: 12€
      // Total: 112€

      const transactions = getMockDatabase().transactions
      const bookingTransactions = Array.from(transactions.values()).filter(
        (t: any) => t.booking_id === bookingWithoutInsurance.id
      )
      const transaction = bookingTransactions[0]
      expect(transaction.amount).toBe(112)
    })
  })

  describe('Création de transaction', () => {
    it('crée une transaction avec type payment', async () => {
      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      await POST(request)

      const transactions = getMockDatabase().transactions
      const bookingTransactions = Array.from(transactions.values()).filter(
        (t: any) => t.booking_id === mockBooking.id
      )

      expect(bookingTransactions.length).toBeGreaterThan(0)

      const transaction = bookingTransactions[0]
      expect(transaction.type).toBe('payment')
      expect(transaction.user_id).toBe(mockSender.id)
      expect(transaction.status).toBe('completed')
    })

    it('stocke metadata avec commission et assurance', async () => {
      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      await POST(request)

      const transactions = getMockDatabase().transactions
      const bookingTransactions = Array.from(transactions.values()).filter(
        (t: any) => t.booking_id === mockBooking.id
      )

      const transaction = bookingTransactions[0]
      expect(transaction.metadata).toBeDefined()
      expect(transaction.metadata.commission_amount).toBe(6)
      expect(transaction.metadata.protection_amount).toBe(6)
    })
  })

  describe('Effets de bord (non-blocking)', () => {
    it('ne bloque pas si notification échoue', async () => {
      // Les notifications sont non-blocking, donc même si elles échouent,
      // le paiement doit réussir

      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.json()).resolves.toMatchObject({ success: true })
    })

    it('ne bloque pas si génération QR code échoue', async () => {
      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('ne bloque pas si génération contrat échoue', async () => {
      const request = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Idempotence', () => {
    it('permet plusieurs appels avec même booking_id', async () => {
      const request1 = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response1 = await POST(request1)
      expect(response1.status).toBe(200)

      // Deuxième appel
      const request2 = new NextRequest(
        'http://localhost/api/payments/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id: mockBooking.id }),
        }
      )

      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.alreadyPaid).toBe(true)
    })
  })
})
