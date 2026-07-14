import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
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

async function seedPaidBooking() {
  const travelerId = await getUserId(PERSONAS.traveler.email)
  const senderId = await getUserId(PERSONAS.sender.email)
  const announcement = await createTestAnnouncement(travelerId)
  const booking = await createTestBooking(senderId, announcement.id)
  await updateTestBookingStatus(booking.id, 'paid')
  return { bookingId: booking.id, senderId, travelerId }
}

async function cleanupBookingReportData(
  supabaseAdmin: any,
  bookingId: string,
  senderId: string,
  travelerId: string
) {
  await supabaseAdmin
    .from('booking_reports')
    .delete()
    .eq('booking_id', bookingId)
  await supabaseAdmin.from('notifications').delete().eq('booking_id', bookingId)
  await deleteTestBookings(senderId)
  await deleteTestAnnouncements(travelerId)
}

test.describe('Signalements reservation V1', () => {
  test('happy path: sender signale, admin examine puis resout, sender est notifie', async ({
    senderPage,
    adminPage,
    supabaseAdmin,
  }) => {
    const { bookingId, senderId, travelerId } = await seedPaidBooking()

    try {
      await senderPage.goto(`/dashboard/colis/${bookingId}`)
      await senderPage
        .getByRole('button', {
          name: /signaler un probleme|signaler un problème/i,
        })
        .click()
      await senderPage.getByText(/signaler un imprevu|signaler un imprévu/i)
      await senderPage.getByRole('combobox', { name: /motif/i }).click()
      await senderPage
        .getByRole('option', {
          name: /le voyageur ne repond plus|le voyageur ne répond plus/i,
        })
        .click()
      await senderPage
        .getByLabel(/description/i)
        .fill(
          'Le voyageur ne répond plus depuis plusieurs jours malgré mes relances et la remise approche.'
        )
      await senderPage
        .getByRole('button', { name: /envoyer le signalement/i })
        .click()

      await expect(
        senderPage.getByText(/signalement envoye|signalement envoyé/i)
      ).toBeVisible({
        timeout: 15_000,
      })

      const { data: createdReport } = await supabaseAdmin
        .from('booking_reports')
        .select('id, reason, status, reported_by')
        .eq('booking_id', bookingId)
        .single()

      expect(createdReport).toMatchObject({
        reason: 'traveler_unresponsive',
        status: 'open',
        reported_by: senderId,
      })

      await expect
        .poll(async () => {
          const { data } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('booking_id', bookingId)
            .eq('type', 'system_alert')
          return data?.length || 0
        })
        .toBeGreaterThan(0)

      await adminPage.goto('/admin/bookings')
      const adminMain = adminPage.locator('main')
      await expect(
        adminMain.getByRole('button', { name: /examiner/i }).first()
      ).toBeVisible({
        timeout: 15_000,
      })

      await adminMain
        .getByRole('button', { name: /examiner/i })
        .first()
        .click()
      await adminPage.getByRole('button', { name: /confirmer/i }).click()

      await expect
        .poll(async () => {
          const { data } = await supabaseAdmin
            .from('booking_reports')
            .select('status')
            .eq('id', createdReport!.id)
            .single()
          return data?.status
        })
        .toBe('reviewing')

      await adminMain
        .getByRole('button', { name: /resoudre|résoudre/i })
        .first()
        .click()
      await adminPage
        .getByLabel(/note admin/i)
        .fill('Utilisateur recontacté, la situation est clarifiée.')
      await adminPage.getByRole('button', { name: /confirmer/i }).click()

      await expect
        .poll(async () => {
          const { data } = await supabaseAdmin
            .from('booking_reports')
            .select('status, admin_note, resolved_at')
            .eq('id', createdReport!.id)
            .single()
          return data
        })
        .toMatchObject({
          status: 'resolved',
          admin_note: 'Utilisateur recontacté, la situation est clarifiée.',
        })

      const { data: senderNotifications } = await supabaseAdmin
        .from('notifications')
        .select('title, content, user_id')
        .eq('booking_id', bookingId)
        .eq('user_id', senderId)
        .order('created_at', { ascending: false })

      expect(senderNotifications?.[0]?.title).toMatch(/signalement/i)
      expect(senderNotifications?.[0]?.content).toMatch(/traite|traité/i)
    } finally {
      await cleanupBookingReportData(
        supabaseAdmin,
        bookingId,
        senderId,
        travelerId
      )
    }
  })

  test('validation: message trop court et anti-doublon', async ({
    senderPage,
    supabaseAdmin,
  }) => {
    const { bookingId, senderId, travelerId } = await seedPaidBooking()

    try {
      await senderPage.goto(`/dashboard/colis/${bookingId}`)
      await senderPage
        .getByRole('button', {
          name: /signaler un probleme|signaler un problème/i,
        })
        .click()
      await senderPage.getByRole('combobox', { name: /motif/i }).click()
      await senderPage
        .getByRole('option', {
          name: /le voyageur ne repond plus|le voyageur ne répond plus/i,
        })
        .click()
      await senderPage.getByLabel(/description/i).fill('Trop court')
      await senderPage
        .getByRole('button', { name: /envoyer le signalement/i })
        .click()

      await expect(
        senderPage.getByText(/20 caracteres|20 caractères/i)
      ).toBeVisible()

      await senderPage
        .getByLabel(/description/i)
        .fill(
          'Le voyageur ne répond plus depuis plusieurs jours malgré mes relances.'
        )
      await senderPage
        .getByRole('button', { name: /envoyer le signalement/i })
        .click()
      await expect(
        senderPage.getByText(/signalement envoye|signalement envoyé/i)
      ).toBeVisible({
        timeout: 15_000,
      })

      await senderPage
        .getByRole('button', {
          name: /signaler un probleme|signaler un problème/i,
        })
        .click()
      await senderPage.getByRole('combobox', { name: /motif/i }).click()
      await senderPage
        .getByRole('option', { name: /remise du colis impossible/i })
        .click()
      await senderPage
        .getByLabel(/description/i)
        .fill('Je tente un second signalement alors que le premier est ouvert.')
      await senderPage
        .getByRole('button', { name: /envoyer le signalement/i })
        .click()

      await expect(
        senderPage.getByText(/deja ouvert|déjà ouvert/i)
      ).toBeVisible()
    } finally {
      await cleanupBookingReportData(
        supabaseAdmin,
        bookingId,
        senderId,
        travelerId
      )
    }
  })

  test('admin: note obligatoire pour classer ou resoudre', async ({
    adminPage,
    supabaseAdmin,
  }) => {
    const { bookingId, senderId, travelerId } = await seedPaidBooking()

    try {
      const { data: report, error } = await supabaseAdmin
        .from('booking_reports')
        .insert({
          booking_id: bookingId,
          reported_by: senderId,
          reported_user_id: travelerId,
          reason: 'handoff_impossible',
          message: 'La remise du colis est impossible au lieu convenu.',
          status: 'open',
        })
        .select('id')
        .single()

      expect(error).toBeFalsy()

      await adminPage.goto('/admin/bookings')
      const adminMain = adminPage.locator('main')
      await expect(
        adminMain.getByRole('button', { name: /classer/i }).first()
      ).toBeVisible({
        timeout: 15_000,
      })

      await adminMain
        .getByRole('button', { name: /classer/i })
        .first()
        .click()
      await adminPage.getByLabel(/note admin/i).fill('court')
      await adminPage.getByRole('button', { name: /confirmer/i }).click()

      await expect(
        adminPage.getByText(/10 caracteres|10 caractères/i)
      ).toBeVisible()

      const { data: unchanged } = await supabaseAdmin
        .from('booking_reports')
        .select('status')
        .eq('id', report!.id)
        .single()
      expect(unchanged?.status).toBe('open')
    } finally {
      await cleanupBookingReportData(
        supabaseAdmin,
        bookingId,
        senderId,
        travelerId
      )
    }
  })
})
