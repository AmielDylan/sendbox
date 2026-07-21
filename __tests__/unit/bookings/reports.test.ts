import { describe, it, expect, beforeEach } from 'vitest'
import { createBookingReport } from '@/lib/core/bookings/reports'
import { createMockAdmin, createMockUser } from '../../factories/user.factory'
import { createMockPublishedAnnouncement } from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  getMockDatabase,
  resetMockDatabase,
  seedMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

describe('createBookingReport', () => {
  const mockSender = createMockUser({
    id: 'sender-report-1',
    email: 'sender-report@test.com',
    role: 'sender',
    kyc_status: 'approved',
  })

  const mockTraveler = createMockUser({
    id: 'traveler-report-1',
    email: 'traveler-report@test.com',
    role: 'traveler',
    kyc_status: 'approved',
  })

  const thirdParty = createMockUser({
    id: 'third-party-report-1',
    email: 'third-report@test.com',
    role: 'sender',
    kyc_status: 'approved',
  })

  const admin = createMockAdmin({
    id: 'admin-report-1',
    email: 'admin-report@test.com',
  })

  let mockAnnouncement: ReturnType<typeof createMockPublishedAnnouncement>
  let booking: ReturnType<typeof createMockBooking>

  beforeEach(() => {
    resetMockDatabase()

    mockAnnouncement = createMockPublishedAnnouncement({
      traveler_id: mockTraveler.id,
      available_kg: 10,
      status: 'active' as any,
    })

    booking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      traveler_id: mockTraveler.id,
      status: 'paid',
      paid_at: new Date().toISOString(),
    })

    seedMockDatabase('profiles', [mockSender, mockTraveler, thirdParty, admin])
    seedMockDatabase('announcements', [mockAnnouncement])
    seedMockDatabase('bookings', [booking])
  })

  it('crée un signalement pour une partie de la réservation', async () => {
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })

    const result = await createBookingReport({
      bookingId: booking.id,
      reason: 'traveler_unresponsive',
      message:
        'Le voyageur ne répond plus depuis plusieurs jours malgré mes relances.',
    })

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)

    const reports = Array.from(getMockDatabase().booking_reports.values())
    expect(reports).toHaveLength(1)
    expect(reports[0]).toMatchObject({
      booking_id: booking.id,
      reported_by: mockSender.id,
      reported_user_id: mockTraveler.id,
      reason: 'traveler_unresponsive',
      status: 'open',
    })

    const notifications = Array.from(getMockDatabase().notifications.values())
    expect(notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: admin.id,
          type: 'system_alert',
          booking_id: booking.id,
          announcement_id: mockAnnouncement.id,
        }),
      ])
    )
  })

  it('rejette un utilisateur extérieur à la réservation', async () => {
    setMockAuthUser({ id: thirdParty.id, email: thirdParty.email })

    const result = await createBookingReport({
      bookingId: booking.id,
      reason: 'traveler_unresponsive',
      message:
        'Je tente de signaler une réservation qui ne me concerne absolument pas.',
    })

    expect(result.error).toMatch(/pas autorise/i)
    expect(getMockDatabase().booking_reports.size).toBe(0)
  })

  it('rejette les messages trop courts', async () => {
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })

    const result = await createBookingReport({
      bookingId: booking.id,
      reason: 'traveler_unresponsive',
      message: 'Trop court',
    })

    expect(result.error).toMatch(/20 caracteres/i)
    expect(getMockDatabase().booking_reports.size).toBe(0)
  })

  it('demande une date pour un voyage reporté', async () => {
    setMockAuthUser({ id: mockTraveler.id, email: mockTraveler.email })

    const result = await createBookingReport({
      bookingId: booking.id,
      reason: 'travel_postponed',
      message:
        'Mon vol est reporté et je dois proposer une nouvelle date à l’expéditeur.',
    })

    expect(result.error).toMatch(/nouvelle date/i)
    expect(getMockDatabase().booking_reports.size).toBe(0)
  })

  it('rejette un deuxième signalement ouvert du même utilisateur', async () => {
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })

    await createBookingReport({
      bookingId: booking.id,
      reason: 'traveler_unresponsive',
      message:
        'Le voyageur ne répond plus depuis plusieurs jours malgré mes relances.',
    })

    const result = await createBookingReport({
      bookingId: booking.id,
      reason: 'handoff_impossible',
      message:
        'Je veux ouvrir un second signalement alors que le premier est ouvert.',
    })

    expect(result.error).toMatch(/deja ouvert/i)
    expect(getMockDatabase().booking_reports.size).toBe(1)
  })
  it('rejette les statuts non signalables en V1', async () => {
    setMockAuthUser({ id: mockSender.id, email: mockSender.email })

    const completedBooking = createMockBooking({
      announcement_id: mockAnnouncement.id,
      sender_id: mockSender.id,
      traveler_id: mockTraveler.id,
      status: 'completed',
    })
    seedMockDatabase('bookings', [completedBooking])

    const result = await createBookingReport({
      bookingId: completedBooking.id,
      reason: 'traveler_unresponsive',
      message:
        'Je tente de signaler une reservation deja terminee alors que la V1 ne le permet pas.',
    })

    expect(result.error).toMatch(/ne peut pas etre signalee/i)
    expect(getMockDatabase().booking_reports.size).toBe(0)
  })
})
