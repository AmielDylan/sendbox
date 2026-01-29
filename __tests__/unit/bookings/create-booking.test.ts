import { describe, it, expect, beforeEach } from 'vitest'
import { createBooking } from '@/lib/core/bookings/actions'
import { createMockUser } from '../../factories/user.factory'
import {
  createMockAnnouncement,
  createMockPublishedAnnouncement,
} from '../../factories/announcement.factory'
import { seedMockDatabase, resetMockDatabase, setMockAuthUser } from '../../mocks/server'
import type { CreateBookingInput } from '@/lib/core/bookings/validations'

/**
 * Tests pour la création de réservations (createBooking)
 */
describe('createBooking', () => {
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
  let validBookingData: CreateBookingInput

  beforeEach(() => {
    resetMockDatabase()

    // Create fresh announcement for each test
    mockAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockTraveler.id,
      available_kg: 10,
      status: 'active' as any,
    })

    // Create fresh booking data for each test
    validBookingData = {
      announcement_id: mockAnnouncement.id,
      package_description: 'Test package - laptop and documents',
      kilos_requested: 5,
      package_value: 100,
      insurance_opted: false,
    }

    // Seed the mock database with test data
    seedMockDatabase('profiles', [mockSender, mockTraveler])
    seedMockDatabase('announcements', [mockAnnouncement])
    // Set the authenticated user to mockSender by default
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })
  })

  it('crée une réservation avec KYC approuvé', async () => {
    const result = await createBooking(validBookingData)

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(result.bookingId).toBeDefined()
  })

  it('rejette si KYC non approuvé (pending)', async () => {
    const senderPendingKYC = createMockUser({
      id: 'sender-pending-1',
      email: 'sender-pending@test.com',
      kyc_status: 'pending',
    })
    seedMockDatabase('profiles', [senderPendingKYC])
    setMockAuthUser({ id: senderPendingKYC.id, email: senderPendingKYC.email })

    const result = await createBooking(validBookingData)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kyc')
    expect(result.error).toMatch(/vérification en cours/i)
  })

  it('rejette si KYC non approuvé (incomplete)', async () => {
    const senderIncompleteKYC = createMockUser({
      id: 'sender-incomplete-1',
      email: 'sender-incomplete@test.com',
      kyc_status: 'incomplete',
    })
    seedMockDatabase('profiles', [senderIncompleteKYC])
    setMockAuthUser({ id: senderIncompleteKYC.id, email: senderIncompleteKYC.email })

    const result = await createBooking(validBookingData)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kyc')
    expect(result.error).toMatch(/vérification d'identité incomplète/i)
  })

  it('rejette si KYC non approuvé (rejected)', async () => {
    const senderRejectedKYC = createMockUser({
      id: 'sender-rejected-1',
      email: 'sender-rejected@test.com',
      kyc_status: 'rejected',
      kyc_rejection_reason: 'Documents invalides',
    })
    seedMockDatabase('profiles', [senderRejectedKYC])
    setMockAuthUser({ id: senderRejectedKYC.id, email: senderRejectedKYC.email })

    const result = await createBooking(validBookingData)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kyc')
    expect(result.error).toMatch(/vérification refusée/i)
  })

  it('rejette si l utilisateur réserve sa propre annonce', async () => {
    // L'annonce appartient au même utilisateur qui essaie de réserver
    const ownAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockSender.id, // Same user as sender
      available_kg: 10,
      status: 'active' as any,
    })
    seedMockDatabase('announcements', [ownAnnouncement])
    // Set the authenticated user to mockSender by default
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })

    const result = await createBooking({
      ...validBookingData,
      announcement_id: ownAnnouncement.id,
    })

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/vous ne pouvez pas réserver votre propre annonce/i)
  })

  it('rejette si l annonce n est pas active', async () => {
    const inactiveAnnouncement = createMockAnnouncement({
      traveler_id: mockTraveler.id,
      status: 'draft' as any,
    })
    seedMockDatabase('announcements', [inactiveAnnouncement])
    // Set the authenticated user to mockSender by default
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })

    const result = await createBooking({
      ...validBookingData,
      announcement_id: inactiveAnnouncement.id,
    })

    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/n'est plus disponible/i)
  })

  it('rejette si capacité insuffisante', async () => {
    const result = await createBooking({
      ...validBookingData,
      kilos_requested: 15, // Plus que les 10kg disponibles
    })

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kilos_requested')
    expect(result.error).toMatch(/capacité insuffisante/i)
  })

  it('rejette si poids demandé invalide (négatif)', async () => {
    const result = await createBooking({
      ...validBookingData,
      kilos_requested: -5,
    })

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kilos_requested')
  })

  it('rejette si poids demandé invalide (zéro)', async () => {
    const result = await createBooking({
      ...validBookingData,
      kilos_requested: 0,
    })

    expect(result.error).toBeDefined()
    expect(result.field).toBe('kilos_requested')
  })

  it('rejette si description du colis est vide', async () => {
    const result = await createBooking({
      ...validBookingData,
      package_description: '',
    })

    expect(result.error).toBeDefined()
    expect(result.field).toBe('package_description')
  })
})
