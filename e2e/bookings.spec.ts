import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import {
  createTestAnnouncement,
  deleteTestAnnouncements,
} from './helpers/seed-announcement'
import { createTestBooking, deleteTestBookings } from './helpers/seed-booking'
import { createE2EAdminClient } from './helpers/supabase-admin'

// Booking tests share the same DB users, run serially to avoid state collisions.
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

test.describe('Creation reservation - Sender', () => {
  let announcementId: string
  let travelerId: string

  test.beforeEach(async () => {
    travelerId = await getUserId(PERSONAS.traveler.email)
    const announcement = await createTestAnnouncement(travelerId)
    announcementId = announcement.id
  })

  test.afterEach(async () => {
    const senderId = await getUserId(PERSONAS.sender.email)
    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)
  })

  test('page colis/new charge avec les details annonce', async ({
    senderPage,
  }) => {
    await senderPage.goto(`/dashboard/colis/new?announcement=${announcementId}`)
    await expect(senderPage).toHaveURL(/colis\/new/)
    await expect(senderPage.getByText(/paris|cotonou/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('submit cree un booking en status pending', async ({
    senderPage,
    supabaseAdmin,
  }) => {
    const senderId = await getUserId(PERSONAS.sender.email)

    await senderPage.goto(`/dashboard/colis/new?announcement=${announcementId}`)

    await senderPage.waitForSelector('#package_description', {
      state: 'visible',
      timeout: 15_000,
    })

    await senderPage.locator('#package_category').selectOption('documents')
    await senderPage.locator('#package_dimensions').fill('30 x 20 x 10 cm')
    await senderPage
      .locator('#package_description')
      .fill('Colis test E2E - contenu standard')
    await senderPage.getByLabel(/ne contient aucun objet interdit/i).check()
    await senderPage
      .getByLabel(/description, la valeur et les dimensions/i)
      .check()

    await senderPage
      .getByRole('button', { name: /envoyer la demande/i })
      .click()

    await senderPage.waitForURL(/colis\/[0-9a-f-]{36}/, { timeout: 15_000 })

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

test.describe('Decision reservation - Traveler', () => {
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
  })

  test.afterEach(async () => {
    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)
  })

  test('voyageur accepte la demande apres relecture colis et notifie expediteur', async ({
    travelerPage,
    senderPage,
    supabaseAdmin,
  }) => {
    await travelerPage.goto('/dashboard/messages?tab=requests')
    await expect(
      travelerPage.getByText('Test booking created by E2E')
    ).toBeVisible({ timeout: 15_000 })

    await travelerPage.getByRole('button', { name: /accepter/i }).click()
    await expect(
      travelerPage.getByText(/accepter cette demande/i)
    ).toBeVisible()
    await expect(
      travelerPage.getByText('Declaration colis', { exact: true })
    ).toBeVisible()

    await travelerPage.getByLabel(/j'ai relu la declaration colis/i).check()
    await travelerPage.getByRole('button', { name: /confirmer/i }).click()

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .single()
        return data?.status
      })
      .toBe('accepted')

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('notifications')
          .select('title, content, user_id')
          .eq('booking_id', bookingId)
          .eq('user_id', senderId)
          .eq('type', 'booking_accepted')
          .maybeSingle()
        return data
      })
      .toMatchObject({ user_id: senderId })

    await senderPage.goto(`/dashboard/colis/${bookingId}`)
    await expect(senderPage.getByText(/payer maintenant/i).first()).toBeVisible(
      { timeout: 20_000 }
    )
  })

  test('voyageur refuse avec motif colis structure et notifie expediteur', async ({
    travelerPage,
    senderPage,
    supabaseAdmin,
  }) => {
    await travelerPage.goto('/dashboard/messages?tab=requests')
    await expect(
      travelerPage.getByText('Test booking created by E2E')
    ).toBeVisible({ timeout: 15_000 })

    await travelerPage.getByRole('button', { name: /refuser/i }).click()
    await expect(travelerPage.getByText(/refuser cette demande/i)).toBeVisible()
    await expect(
      travelerPage.getByText('Declaration colis', { exact: true })
    ).toBeVisible()

    await travelerPage
      .getByRole('combobox', { name: /raison du refus/i })
      .click()
    await travelerPage
      .getByRole('option', { name: /objet interdit ou a risque/i })
      .click()
    await travelerPage
      .getByRole('button', { name: /confirmer le refus/i })
      .click()

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('bookings')
          .select('status, refused_reason, refused_at')
          .eq('id', bookingId)
          .single()
        return data
      })
      .toMatchObject({
        status: 'cancelled',
        refused_reason: 'Objet interdit ou a risque',
      })

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('refused_at')
      .eq('id', bookingId)
      .single()
    expect(booking?.refused_at).toBeTruthy()

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('notifications')
          .select('title, content, user_id')
          .eq('booking_id', bookingId)
          .eq('user_id', senderId)
          .eq('type', 'booking_refused')
          .maybeSingle()
        return data
      })
      .toMatchObject({ user_id: senderId })

    await senderPage.goto(`/dashboard/colis/${bookingId}`)
    await expect(senderPage.getByText(/raison du refus/i)).toBeVisible({
      timeout: 20_000,
    })
    await expect(
      senderPage.getByText(/objet interdit ou a risque/i)
    ).toBeVisible()
  })
})
