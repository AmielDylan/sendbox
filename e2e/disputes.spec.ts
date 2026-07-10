import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import { createTestAnnouncement } from './helpers/seed-announcement'
import {
  createTestBooking,
  deleteTestBookings,
  updateTestBookingStatus,
} from './helpers/seed-booking'
import { createE2EAdminClient } from './helpers/supabase-admin'

test.describe.configure({ mode: 'serial' })

async function getUserId(email: string): Promise<string> {
  const supabase = createE2EAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()
  if (!data?.id) throw new Error(`User not found: ${email}`)
  return data.id
}

test.describe('Litiges V1 actionnables', () => {
  let bookingId: string
  let senderId: string

  test.beforeEach(async () => {
    const travelerId = await getUserId(PERSONAS.traveler.email)
    senderId = await getUserId(PERSONAS.sender.email)
    const announcement = await createTestAnnouncement(travelerId)
    const booking = await createTestBooking(senderId, announcement.id)
    bookingId = booking.id
    await updateTestBookingStatus(bookingId, 'paid')
  })

  test.afterEach(async ({ supabaseAdmin }) => {
    await supabaseAdmin.from('disputes').delete().eq('booking_id', bookingId)
    await deleteTestBookings(senderId)
  })

  test("un expediteur ouvre un litige et l'admin voit le dossier", async ({
    senderPage,
    adminPage,
    supabaseAdmin,
  }) => {
    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .single()
        return data?.status
      })
      .toBe('paid')

    await senderPage.goto('/dashboard')
    const disputeResponse = await senderPage.evaluate(async bookingId => {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: bookingId,
          reason: 'package_lost',
          description:
            'Le colis est introuvable depuis la confirmation. Le voyageur ne repond plus aux messages depuis le rendez-vous.',
        }),
      })

      return {
        ok: res.ok,
        status: res.status,
        body: await res.json().catch(() => null),
      }
    }, bookingId)

    expect(disputeResponse).toMatchObject({ ok: true, status: 200 })

    const { data: dispute } = await supabaseAdmin
      .from('disputes')
      .select('id, reason, description, status')
      .eq('booking_id', bookingId)
      .single()

    expect(dispute?.reason).toBe('Colis perdu')
    expect(dispute?.description).toContain('attendus')
    expect(dispute?.status).toBe('OPEN')

    await adminPage.goto('/admin/disputes')
    await expect(adminPage.getByText('Colis perdu').first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      adminPage.getByText(bookingId.slice(0, 8)).first()
    ).toBeVisible()
  })
})
