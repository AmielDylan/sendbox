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

async function cleanRatingsForBooking(bookingId: string) {
  const supabase = createE2EAdminClient()
  await supabase.from('ratings').delete().eq('booking_id', bookingId)
}

async function submitReview(page: Page, bookingId: string, criterion: RegExp) {
  await page.goto(`/dashboard/colis/${bookingId}/noter`)
  await expect(
    page.getByRole('heading', { name: /noter le service/i })
  ).toBeVisible({ timeout: 15_000 })

  await page
    .getByRole('button', { name: /selectionner 5 etoiles/i })
    .click()
  await page.getByText(criterion).click()
  await page
    .locator('#comment')
    .fill(
      'Experience tres claire, communication fluide et remise conforme aux informations partagees.'
    )
  await page.getByRole('button', { name: /envoyer l'avis/i }).click()
}

test.describe('Avis apres livraison V1', () => {
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
    await updateTestBookingStatus(bookingId, 'delivered')
    await cleanRatingsForBooking(bookingId)
  })

  test.afterEach(async ({ supabaseAdmin }) => {
    await supabaseAdmin.from('ratings').delete().eq('booking_id', bookingId)
    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)
  })

  test('les avis restent caches jusqu aux deux soumissions puis sont publies', async ({
    senderPage,
    travelerPage,
    supabaseAdmin,
  }) => {
    await submitReview(senderPage, bookingId, /voyageur recommande/i)

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('ratings')
          .select('status, rating, rater_id, rated_id, comment')
          .eq('booking_id', bookingId)
          .eq('rater_id', senderId)
          .maybeSingle()
        return data
      })
      .toMatchObject({
        status: 'submitted',
        rating: 5,
        rater_id: senderId,
        rated_id: travelerId,
      })

    const { data: firstReview } = await supabaseAdmin
      .from('ratings')
      .select('published_at, comment')
      .eq('booking_id', bookingId)
      .eq('rater_id', senderId)
      .single()

    expect(firstReview?.published_at).toBeNull()
    expect(firstReview?.comment).toContain('Voyageur recommande')

    await submitReview(travelerPage, bookingId, /expediteur recommande/i)

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('ratings')
          .select('status, published_at, rater_id, rated_id')
          .eq('booking_id', bookingId)
          .order('rater_id')
        return data
      })
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'published',
            published_at: expect.any(String),
            rater_id: senderId,
            rated_id: travelerId,
          }),
          expect.objectContaining({
            status: 'published',
            published_at: expect.any(String),
            rater_id: travelerId,
            rated_id: senderId,
          }),
        ])
      )
  })
})
