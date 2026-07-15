import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import * as path from 'path'
import {
  createTestAnnouncement,
  deleteTestAnnouncements,
} from './helpers/seed-announcement'
import { createTestBooking, deleteTestBookings } from './helpers/seed-booking'
import { createE2EAdminClient } from './helpers/supabase-admin'

const STATE_DIR = path.resolve(__dirname, '../.playwright/state')

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

async function cleanPersonaData(userIds: string[]) {
  const supabase = createE2EAdminClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .or(
      userIds
        .flatMap(userId => [
          `sender_id.eq.${userId}`,
          `traveler_id.eq.${userId}`,
        ])
        .join(',')
    )

  const bookingIds = bookings?.map(booking => booking.id) || []

  if (bookingIds.length > 0) {
    await supabase.from('booking_reports').delete().in('booking_id', bookingIds)
    await supabase.from('disputes').delete().in('booking_id', bookingIds)
    await supabase.from('notifications').delete().in('booking_id', bookingIds)
    await supabase.from('bookings').delete().in('id', bookingIds)
  }

  await supabase.from('notifications').delete().in('user_id', userIds)
  await supabase.from('announcements').delete().in('traveler_id', userIds)
}

async function openMobilePage(browser: any, persona: keyof typeof PERSONAS) {
  const context = await browser.newContext({
    storageState: path.join(STATE_DIR, `${persona}.json`),
    viewport: { width: 390, height: 844 },
    isMobile: true,
  })
  const page = await context.newPage()
  return { context, page }
}

async function expectNoHorizontalOverflow(page: any) {
  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1
  )
  expect(hasHorizontalOverflow).toBe(false)
}

test.describe('Utilisateur mobile responsive V1', () => {
  let senderId: string
  let travelerId: string

  test.beforeEach(async () => {
    senderId = await getUserId(PERSONAS.sender.email)
    travelerId = await getUserId(PERSONAS.traveler.email)
    await cleanPersonaData([senderId, travelerId])
  })

  test.afterEach(async () => {
    await cleanPersonaData([senderId, travelerId])
  })

  test('dashboard et empty states utilisateur restent lisibles sur mobile', async ({
    browser,
  }) => {
    const { context, page } = await openMobilePage(browser, 'sender')

    try {
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(
        page.getByRole('heading', { name: /tableau de bord/i })
      ).toBeVisible({ timeout: 15_000 })
      await expectNoHorizontalOverflow(page)

      await page.goto('/dashboard/colis')
      await expect(page.getByText(/aucun colis pour le moment/i)).toBeVisible({
        timeout: 15_000,
      })
      await expect(
        page.getByRole('link', { name: /trouver un voyageur/i })
      ).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.goto('/dashboard/notifications')
      await expect(page.getByText(/aucune notification/i)).toBeVisible({
        timeout: 15_000,
      })
      await expectNoHorizontalOverflow(page)
    } finally {
      await context.close()
    }
  })

  test('liste et detail colis restent utilisables sur mobile avec une reservation', async ({
    browser,
    supabaseAdmin,
  }) => {
    const announcement = await createTestAnnouncement(travelerId)

    const { context, page } = await openMobilePage(browser, 'sender')

    try {
      await page.goto(`/dashboard/colis/new?announcement=${announcement.id}`)
      await page.waitForSelector('#package_description', {
        state: 'visible',
        timeout: 15_000,
      })
      await page.locator('#package_category').selectOption('documents')
      await page.locator('#package_dimensions').fill('30 x 20 x 10 cm')
      await page
        .locator('#package_description')
        .fill('Colis test mobile E2E - contenu standard')
      await page.getByLabel(/ne contient aucun objet interdit/i).check()
      await page.getByLabel(/description, la valeur et les dimensions/i).check()
      await page.getByRole('button', { name: /envoyer la demande/i }).click()
      await page.waitForURL(/colis\/[0-9a-f-]{36}/, { timeout: 15_000 })

      const bookingId = page.url().split('/').pop()
      if (!bookingId) throw new Error('Booking id introuvable apres creation')

      await expect
        .poll(async () => {
          const { data } = await supabaseAdmin
            .from('bookings')
            .select('id, sender_id, traveler_id')
            .eq('id', bookingId)
            .single()
          return data
        })
        .toMatchObject({ id: bookingId, sender_id: senderId })

      await page.goto('/dashboard/colis')
      await expect(page.getByText(/Paris/).first()).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByText(/Cotonou/).first()).toBeVisible()
      await expect(
        page.getByRole('link', { name: /voir les d.tails/i })
      ).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.goto(`/dashboard/colis/${bookingId}`)
      await expect(page.getByText(/Paris/).first()).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByText(/Cotonou/).first()).toBeVisible()
      await expect(page.getByText(/colis test mobile e2e/i)).toBeVisible()
      await expectNoHorizontalOverflow(page)
    } finally {
      await context.close()
      await deleteTestBookings(senderId)
      await deleteTestAnnouncements(travelerId)
    }
  })

  test('demandes recues voyageur restent lisibles sur mobile', async ({
    browser,
  }) => {
    const announcement = await createTestAnnouncement(travelerId)
    await createTestBooking(senderId, announcement.id)

    const { context, page } = await openMobilePage(browser, 'traveler')

    try {
      await page.goto('/dashboard/messages?tab=requests')
      await expect(page.getByText('Test booking created by E2E')).toBeVisible({
        timeout: 15_000,
      })
      await expect(
        page.getByRole('button', { name: /accepter/i }).first()
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: /refuser/i }).first()
      ).toBeVisible()
      await expectNoHorizontalOverflow(page)
    } finally {
      await context.close()
      await deleteTestBookings(senderId)
      await deleteTestAnnouncements(travelerId)
    }
  })
})
