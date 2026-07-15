import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import * as path from 'path'
import {
  createTestAnnouncement,
  deleteTestAnnouncements,
} from './helpers/seed-announcement'
import { createTestBooking, deleteTestBookings } from './helpers/seed-booking'

const STATE_DIR = path.resolve(__dirname, '../.playwright/state')

async function getPersonaUserId(supabaseAdmin: any, email: string) {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const user = users?.users.find((candidate: any) => candidate.email === email)
  if (!user) throw new Error(`Utilisateur E2E introuvable: ${email}`)
  return user.id
}

async function openMobileAdminPage(browser: any) {
  const context = await browser.newContext({
    storageState: path.join(STATE_DIR, 'admin.json'),
    viewport: { width: 390, height: 844 },
    isMobile: true,
  })
  const page = await context.newPage()
  return { context, page }
}

test.describe('Guard — accès admin', () => {
  test('non-admin redirigé hors de /admin', async ({ senderPage }) => {
    await senderPage.goto('/admin/dashboard')
    // Should redirect to /dashboard or show unauthorized
    await expect(senderPage).not.toHaveURL(/\/admin\/dashboard/)
  })
})

test.describe('Dashboard admin', () => {
  test('page charge sans erreur et affiche les stats', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/dashboard')
    await expect(adminPage).toHaveURL(/\/admin\/dashboard/)
    // Stats cards should be visible
    await expect(
      adminPage.locator('[class*="card"], [class*="stat"]').first()
    ).toBeVisible()
  })
})

test.describe('Admin KYC', () => {
  test('page /admin/kyc affiche les utilisateurs avec KYC en attente', async ({
    adminPage,
    supabaseAdmin,
  }) => {
    // Seed a pending KYC user by updating the sender
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const sender = users?.users.find(u => u.email === PERSONAS.sender.email)
    if (sender) {
      await supabaseAdmin
        .from('profiles')
        .update({ kyc_status: 'pending', verification_status: 'pending' })
        .eq('id', sender.id)
    }

    await adminPage.goto('/admin/kyc')
    await expect(adminPage).toHaveURL(/\/admin\/kyc/)
    await expect(
      adminPage.locator('table, [role="table"]').first()
    ).toBeVisible()

    // Restore sender KYC status
    if (sender) {
      await supabaseAdmin
        .from('profiles')
        .update({ kyc_status: 'approved', verification_status: 'verified' })
        .eq('id', sender.id)
    }
  })

  test("un admin n'apparait pas dans la file KYC meme si son statut est pending", async ({
    adminPage,
    supabaseAdmin,
  }) => {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const admin = users?.users.find(u => u.email === PERSONAS.admin.email)
    if (!admin) throw new Error('Admin E2E introuvable')

    await supabaseAdmin
      .from('profiles')
      .update({ kyc_status: 'pending', verification_status: 'pending' })
      .eq('id', admin.id)

    try {
      await adminPage.goto('/admin/kyc')
      await expect(adminPage).toHaveURL(/\/admin\/kyc/)
      await expect(
        adminPage.getByText(PERSONAS.admin.email, { exact: true })
      ).toHaveCount(0)
    } finally {
      await supabaseAdmin
        .from('profiles')
        .update({ kyc_status: 'approved', verification_status: 'verified' })
        .eq('id', admin.id)
    }
  })
})

test.describe('Admin Bookings', () => {
  test('page /admin/bookings charge sans erreur', async ({ adminPage }) => {
    await adminPage.goto('/admin/bookings')
    await expect(adminPage).toHaveURL(/\/admin\/bookings/)
    await expect(adminPage.locator('body')).toBeVisible()
  })
})

test.describe('Admin mobile responsive', () => {
  test('la modération des annonces utilise un menu actions sur mobile', async ({
    browser,
    supabaseAdmin,
  }) => {
    const travelerId = await getPersonaUserId(
      supabaseAdmin,
      PERSONAS.traveler.email
    )
    await deleteTestAnnouncements(travelerId)
    await createTestAnnouncement(travelerId)

    const { context, page } = await openMobileAdminPage(browser)

    try {
      await page.goto('/admin/announcements')
      await expect(page).toHaveURL(/\/admin\/announcements/)
      await expect(page.locator('table')).toBeHidden()
      await expect(page.getByText(/Paris/).first()).toBeVisible()
      await expect(page.getByText(/Cotonou/).first()).toBeVisible()

      await page.getByRole('button', { name: /actions annonce/i }).click()
      await expect(
        page.getByRole('menuitem', { name: /rejeter/i })
      ).toBeVisible()
    } finally {
      await context.close()
      await deleteTestAnnouncements(travelerId)
    }
  })

  test('les réservations admin restent lisibles sans débordement horizontal sur mobile', async ({
    browser,
    supabaseAdmin,
  }) => {
    const senderId = await getPersonaUserId(
      supabaseAdmin,
      PERSONAS.sender.email
    )
    const travelerId = await getPersonaUserId(
      supabaseAdmin,
      PERSONAS.traveler.email
    )

    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)
    const announcement = await createTestAnnouncement(travelerId)
    const booking = await createTestBooking(senderId, announcement.id)

    const { context, page } = await openMobileAdminPage(browser)

    try {
      await page.goto('/admin/bookings')
      await expect(page).toHaveURL(/\/admin\/bookings/)
      await expect(page.locator('table')).toBeHidden()
      await expect(
        page.getByText(`${booking.id.slice(0, 8)}...`).first()
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: /^actions$/i }).first()
      ).toBeVisible()

      const hasHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
      )
      expect(hasHorizontalOverflow).toBe(false)
    } finally {
      await context.close()
      await deleteTestBookings(senderId)
      await deleteTestAnnouncements(travelerId)
    }
  })
})
