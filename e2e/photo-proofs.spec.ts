import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import type { Page } from '@playwright/test'
import {
  createTestAnnouncement,
  deleteTestAnnouncements,
} from './helpers/seed-announcement'
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

async function postPhotoProof(
  page: Page,
  bookingId: string,
  body: {
    type: 'handoff' | 'delivery'
    url?: string
    sizeBytes?: number
    capturedAt?: string
  }
) {
  await page.goto('/dashboard')
  return page.evaluate(
    async ({ bookingId, body }) => {
      const response = await fetch(`/api/bookings/${bookingId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: body.url ?? `https://example.test/${body.type}.jpg`,
          type: body.type,
          sizeBytes: body.sizeBytes ?? 123_456,
          capturedAt: body.capturedAt,
        }),
      })

      return {
        ok: response.ok,
        status: response.status,
        body: await response.json().catch(() => null),
      }
    },
    { bookingId, body }
  )
}

test.describe('Preuves photo depot et livraison V1', () => {
  let bookingId: string
  let senderId: string
  let travelerId: string

  test.beforeEach(async () => {
    travelerId = await getUserId(PERSONAS.traveler.email)
    senderId = await getUserId(PERSONAS.sender.email)
    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)

    const announcement = await createTestAnnouncement(travelerId)
    const booking = await createTestBooking(senderId, announcement.id)
    bookingId = booking.id
    await updateTestBookingStatus(bookingId, 'confirmed')
  })

  test.afterEach(async ({ supabaseAdmin }) => {
    await supabaseAdmin
      .from('booking_photos')
      .delete()
      .eq('booking_id', bookingId)
    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)
  })

  test('seul le voyageur ajoute les preuves au bon moment avec horodatage serveur', async ({
    senderPage,
    travelerPage,
    supabaseAdmin,
  }) => {
    const senderAttempt = await postPhotoProof(senderPage, bookingId, {
      type: 'handoff',
    })
    expect(senderAttempt).toMatchObject({
      ok: false,
      status: 403,
      body: { code: 'FORBIDDEN' },
    })

    const earlyDeliveryAttempt = await postPhotoProof(travelerPage, bookingId, {
      type: 'delivery',
    })
    expect(earlyDeliveryAttempt).toMatchObject({
      ok: false,
      status: 422,
      body: { code: 'INVALID_STATUS' },
    })

    const clientControlledDate = '2020-01-15T08:30:00.000Z'
    const beforeHandoff = Date.now()
    const handoffResult = await postPhotoProof(travelerPage, bookingId, {
      type: 'handoff',
      capturedAt: clientControlledDate,
    })
    const afterHandoff = Date.now()

    expect(handoffResult).toMatchObject({
      ok: true,
      status: 200,
      body: { success: true, capturedAt: expect.any(String) },
    })
    expect(handoffResult.body.capturedAt).not.toBe(clientControlledDate)
    expect(
      new Date(handoffResult.body.capturedAt).getTime()
    ).toBeGreaterThanOrEqual(beforeHandoff)
    expect(
      new Date(handoffResult.body.capturedAt).getTime()
    ).toBeLessThanOrEqual(afterHandoff + 1_000)

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('booking_photos')
          .select('type, uploaded_by_id, captured_at, size_bytes, url')
          .eq('booking_id', bookingId)
          .eq('type', 'handoff')
          .maybeSingle()
        return data
      })
      .toMatchObject({
        type: 'handoff',
        uploaded_by_id: travelerId,
        size_bytes: 123_456,
        url: 'https://example.test/handoff.jpg',
      })

    await updateTestBookingStatus(bookingId, 'handed')

    const deliveryResult = await postPhotoProof(travelerPage, bookingId, {
      type: 'delivery',
      url: 'https://example.test/delivery.jpg',
      sizeBytes: 234_567,
    })

    expect(deliveryResult).toMatchObject({
      ok: true,
      status: 200,
      body: { success: true, capturedAt: expect.any(String) },
    })

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('booking_photos')
          .select('type, uploaded_by_id, size_bytes, url')
          .eq('booking_id', bookingId)
          .eq('type', 'delivery')
          .maybeSingle()
        return data
      })
      .toMatchObject({
        type: 'delivery',
        uploaded_by_id: travelerId,
        size_bytes: 234_567,
        url: 'https://example.test/delivery.jpg',
      })
  })
})
