import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import { createTestAnnouncement } from './helpers/seed-announcement'
import { createTestBooking, acceptTestBooking, deleteTestBookings } from './helpers/seed-booking'
import { createE2EAdminClient } from './helpers/supabase-admin'

async function getUserId(email: string): Promise<string> {
  const supabase = createE2EAdminClient()
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users.find(u => u.email === email)
  if (!user) throw new Error(`User not found: ${email}`)
  return user.id
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

  test('page colis/new charge avec les détails annonce', async ({ senderPage }) => {
    await senderPage.goto(`/dashboard/colis/new?announcement=${announcementId}`)
    await expect(senderPage).toHaveURL(/colis\/new/)
    // Should show the announcement details
    await expect(senderPage.getByText(/paris.*cotonou|cotonou.*paris|trajet/i).first()).toBeVisible()
  })

  test('submit crée un booking en status pending', async ({ senderPage, supabaseAdmin }) => {
    const senderId = await getUserId(PERSONAS.sender.email)

    await senderPage.goto(`/dashboard/colis/new?announcement=${announcementId}`)

    // Fill booking form
    const descriptionField = senderPage.locator('textarea, input[placeholder*="description" i]').first()
    if (await descriptionField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descriptionField.fill('Test booking created by E2E')
    }

    const submitBtn = senderPage.getByRole('button', { name: /envoyer|réserver|soumettre|confirmer/i }).first()
    await submitBtn.click()

    // Should redirect to booking detail page
    await expect(senderPage).toHaveURL(/colis\/[a-z0-9-]+/, { timeout: 10_000 })

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

  test('booking accepté via DB helper change le statut', async ({ supabaseAdmin }) => {
    await acceptTestBooking(bookingId)

    const { data } = await supabaseAdmin
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single()
    expect(data?.status).toBe('accepted')
  })

  test('sender voit le bouton Payer sur booking accepté', async ({ senderPage }) => {
    await acceptTestBooking(bookingId)

    await senderPage.goto(`/dashboard/colis/${bookingId}`)
    await expect(
      senderPage.getByRole('button', { name: /payer|payment|pay/i }).first()
    ).toBeVisible()
  })
})
