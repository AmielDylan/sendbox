import { describe, it, expect, beforeEach } from 'vitest'
import { updateBookingReportStatus } from '@/lib/core/admin/actions'
import { createMockAdmin, createMockUser } from '../../factories/user.factory'
import { createMockPublishedAnnouncement } from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  getMockDatabase,
  resetMockDatabase,
  seedMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

describe('updateBookingReportStatus', () => {
  const admin = createMockAdmin({
    id: 'admin-report-status-1',
    email: 'admin-report-status@test.com',
  })

  const sender = createMockUser({
    id: 'sender-report-status-1',
    email: 'sender-report-status@test.com',
    role: 'sender',
  })

  const traveler = createMockUser({
    id: 'traveler-report-status-1',
    email: 'traveler-report-status@test.com',
    role: 'traveler',
  })

  let reportId: string
  let booking: ReturnType<typeof createMockBooking>

  beforeEach(() => {
    resetMockDatabase()
    setMockAuthUser({ id: admin.id, email: admin.email })

    const announcement = createMockPublishedAnnouncement({
      traveler_id: traveler.id,
      status: 'active' as any,
    })

    booking = createMockBooking({
      announcement_id: announcement.id,
      sender_id: sender.id,
      traveler_id: traveler.id,
      status: 'paid',
      paid_at: new Date().toISOString(),
    })

    reportId = 'booking-report-status-1'

    seedMockDatabase('profiles', [admin, sender, traveler])
    seedMockDatabase('announcements', [announcement])
    seedMockDatabase('bookings', [booking])
    seedMockDatabase('booking_reports', [
      {
        id: reportId,
        booking_id: booking.id,
        reported_by: sender.id,
        reported_user_id: traveler.id,
        reason: 'traveler_unresponsive',
        message:
          'Le voyageur ne répond plus depuis plusieurs jours malgré mes relances.',
        status: 'open',
        admin_note: null,
        suggested_new_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  })

  it('passe un signalement ouvert en examen', async () => {
    const result = await updateBookingReportStatus(reportId, 'reviewing')

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)

    const report = getMockDatabase().booking_reports.get(reportId)
    expect(report.status).toBe('reviewing')
    expect(report.resolved_at).toBeUndefined()
  })

  it('exige une note admin pour résoudre', async () => {
    const result = await updateBookingReportStatus(reportId, 'resolved', 'ok')

    expect(result.error).toMatch(/10 caracteres/i)

    const report = getMockDatabase().booking_reports.get(reportId)
    expect(report.status).toBe('open')
  })

  it('résout un signalement avec note et notifie le déclarant', async () => {
    const result = await updateBookingReportStatus(
      reportId,
      'resolved',
      'Utilisateur recontacté, situation clarifiée.'
    )

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)

    const report = getMockDatabase().booking_reports.get(reportId)
    expect(report.status).toBe('resolved')
    expect(report.admin_note).toBe(
      'Utilisateur recontacté, situation clarifiée.'
    )
    expect(report.resolved_by).toBe(admin.id)
    expect(report.resolved_at).toBeTruthy()

    const notifications = Array.from(getMockDatabase().notifications.values())
    expect(notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: sender.id,
          type: 'system_alert',
          booking_id: booking.id,
        }),
      ])
    )
  })

  it('rejette un non-admin', async () => {
    setMockAuthUser({ id: sender.id, email: sender.email })

    const result = await updateBookingReportStatus(reportId, 'reviewing')

    expect(result.error).toMatch(/non autorise/i)
    expect(getMockDatabase().booking_reports.get(reportId).status).toBe('open')
  })
})
