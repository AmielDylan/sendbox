import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import { createTestAnnouncement } from './helpers/seed-announcement'
import {
  createTestBooking,
  acceptTestBooking,
  deleteTestBookings,
} from './helpers/seed-booking'
import { createE2EAdminClient } from './helpers/supabase-admin'

// Booking tests share the same DB users — run serially to avoid state collisions.
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

test.describe('Création réservation — Sender', () => {
  let announcementId: string

  test.beforeEach(async () => {
    const travelerId = await getUserId(PERSONAS.traveler.email)
    const announcement = await createTestAnnouncement(travelerId)
    announcementId = announcement.id
  })

  test.afterEach(async () => {
    const senderId = await getUserId(PERSONAS.sender.email)
    await deleteTestBookings(senderId)
  })

  test('page colis/new charge avec les détails annonce', async ({
    senderPage,
  }) => {
    await senderPage.goto(`/dashboard/colis/new?announcement=${announcementId}`)
    await expect(senderPage).toHaveURL(/colis\/new/)
    // Wait for announcement to load, then check route/city text
    await expect(senderPage.getByText(/paris|cotonou/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('submit crée un booking en status pending', async ({
    senderPage,
    supabaseAdmin,
  }) => {
    const senderId = await getUserId(PERSONAS.sender.email)

    await senderPage.goto(`/dashboard/colis/new?announcement=${announcementId}`)

    // Wait for form to finish loading announcement
    await senderPage.waitForSelector('#package_description', {
      state: 'visible',
      timeout: 15_000,
    })

    // Fill required description (min 10 chars)
    await senderPage.locator('#package_category').selectOption('documents')
    await senderPage.locator('#package_dimensions').fill('30 x 20 x 10 cm')
    await senderPage
      .locator('#package_description')
      .fill('Colis test E2E — contenu standard')
    await senderPage.getByLabel(/ne contient aucun objet interdit/i).check()
    await senderPage
      .getByLabel(/description, la valeur et les dimensions/i)
      .check()

    const submitBtn = senderPage.getByRole('button', {
      name: /envoyer la demande/i,
    })
    await submitBtn.click()

    // Should redirect to booking detail page (UUID, not "new")
    await senderPage.waitForURL(/colis\/[0-9a-f-]{36}/, { timeout: 15_000 })

    // Assert in DB
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('id, status')
      .eq('sender_id', senderId)
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: false })
      .limit(1)
    expect(data?.[0]?.status).toBe('pending')
  })
})

test.describe('Acceptation réservation — Traveler', () => {
  let announcementId: string
  let bookingId: string

  test.beforeEach(async () => {
    const travelerId = await getUserId(PERSONAS.traveler.email)
    const senderId = await getUserId(PERSONAS.sender.email)
    const announcement = await createTestAnnouncement(travelerId)
    announcementId = announcement.id
    const booking = await createTestBooking(senderId, announcementId)
    bookingId = booking.id
  })

  test.afterEach(async () => {
    const senderId = await getUserId(PERSONAS.sender.email)
    await deleteTestBookings(senderId)
  })

  test('booking accepté via DB helper change le statut', async ({
    supabaseAdmin,
  }) => {
    await acceptTestBooking(bookingId)

    const { data } = await supabaseAdmin
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single()
    expect(data?.status).toBe('accepted')
  })

  test('sender voit le bouton Payer sur booking accepté', async ({
    senderPage,
  }) => {
    await acceptTestBooking(bookingId)

    await senderPage.goto(`/dashboard/colis/${bookingId}`)
    // "Payer maintenant" renders as <a> via Button asChild+Link
    await expect(senderPage.getByText(/payer maintenant/i).first()).toBeVisible(
      { timeout: 20_000 }
    )
  })
})
