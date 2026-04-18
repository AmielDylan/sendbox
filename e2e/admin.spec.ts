import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import { createE2EAdminClient } from './helpers/supabase-admin'

test.describe('Guard — accès admin', () => {
  test('non-admin redirigé hors de /admin', async ({ senderPage }) => {
    await senderPage.goto('/admin/dashboard')
    // Should redirect to /dashboard or show unauthorized
    await expect(senderPage).not.toHaveURL(/\/admin\/dashboard/)
  })
})

test.describe('Dashboard admin', () => {
  test('page charge sans erreur et affiche les stats', async ({ adminPage }) => {
    await adminPage.goto('/admin/dashboard')
    await expect(adminPage).toHaveURL(/\/admin\/dashboard/)
    // Stats cards should be visible
    await expect(adminPage.locator('[class*="card"], [class*="stat"]').first()).toBeVisible()
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
        .update({ kyc_status: 'pending' })
        .eq('id', sender.id)
    }

    await adminPage.goto('/admin/kyc')
    await expect(adminPage).toHaveURL(/\/admin\/kyc/)
    await expect(adminPage.locator('table, [role="table"]').first()).toBeVisible()

    // Restore sender KYC status
    if (sender) {
      await supabaseAdmin
        .from('profiles')
        .update({ kyc_status: 'approved' })
        .eq('id', sender.id)
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
