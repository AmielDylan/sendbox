import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAdminAnnouncements,
  getAdminBookings,
  getAdminDisputes,
  getAdminTransactions,
} from '@/lib/core/admin/actions'
import { createMockAdmin, createMockUser } from '../../factories/user.factory'
import { createMockPublishedAnnouncement } from '../../factories/announcement.factory'
import { createMockBooking } from '../../factories/booking.factory'
import {
  resetMockDatabase,
  seedMockDatabase,
  setMockAuthUser,
} from '../../mocks/server'

describe('admin read access guards', () => {
  const admin = createMockAdmin({
    id: 'admin-read-guard-1',
    email: 'admin-read-guard@test.com',
  })

  const sender = createMockUser({
    id: 'sender-read-guard-1',
    email: 'sender-read-guard@test.com',
    role: 'sender',
  })

  const traveler = createMockUser({
    id: 'traveler-read-guard-1',
    email: 'traveler-read-guard@test.com',
    role: 'traveler',
  })

  beforeEach(() => {
    resetMockDatabase()

    const announcement = createMockPublishedAnnouncement({
      id: 'announcement-read-guard-1',
      traveler_id: traveler.id,
      status: 'active' as any,
    })

    const booking = createMockBooking({
      id: 'booking-read-guard-1',
      announcement_id: announcement.id,
      sender_id: sender.id,
      traveler_id: traveler.id,
      status: 'paid',
    })

    seedMockDatabase('profiles', [admin, sender, traveler])
    seedMockDatabase('announcements', [announcement])
    seedMockDatabase('bookings', [booking])
    seedMockDatabase('transactions', [
      {
        id: 'transaction-read-guard-1',
        booking_id: booking.id,
        amount: 42,
        type: 'payment',
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    ])
  })

  it.each([
    ['annonces', getAdminAnnouncements],
    ['reservations', getAdminBookings],
    ['litiges', getAdminDisputes],
    ['transactions', getAdminTransactions],
  ])('rejette un non-admin pour les lectures admin: %s', async (_, action) => {
    setMockAuthUser({ id: sender.id, email: sender.email })

    await expect(action()).rejects.toThrow(/non autorise/i)
  })

  it('rejette un appel non authentifie', async () => {
    setMockAuthUser(null)

    await expect(getAdminBookings()).rejects.toThrow(/non autorise/i)
  })

  it('autorise un admin a lire les listes admin principales', async () => {
    setMockAuthUser({ id: admin.id, email: admin.email })

    await expect(getAdminAnnouncements()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'announcement-read-guard-1' }),
      ])
    )
    await expect(getAdminBookings()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'booking-read-guard-1' }),
      ])
    )
    await expect(getAdminTransactions()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'transaction-read-guard-1' }),
      ])
    )
  })
})
