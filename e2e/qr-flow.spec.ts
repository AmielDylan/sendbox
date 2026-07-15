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

async function getOrSetBookingQRCode(bookingId: string): Promise<string> {
  const supabase = createE2EAdminClient()
  const { data } = await supabase
    .from('bookings')
    .select('qr_code')
    .eq('id', bookingId)
    .single()

  if (data?.qr_code) return data.qr_code

  const qrCode = `SENDBOX-${bookingId.slice(0, 8)}-${bookingId.slice(9, 13)}`
  const { error } = await supabase
    .from('bookings')
    .update({ qr_code: qrCode })
    .eq('id', bookingId)

  if (error) throw new Error(`Failed to set QR code: ${error.message}`)
  return qrCode
}

test.describe('QR depot et livraison V1', () => {
  let bookingId: string
  let senderId: string
  let travelerId: string
  let qrCode: string

  test.beforeEach(async () => {
    travelerId = await getUserId(PERSONAS.traveler.email)
    senderId = await getUserId(PERSONAS.sender.email)
    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)

    const announcement = await createTestAnnouncement(travelerId)
    const booking = await createTestBooking(senderId, announcement.id)
    bookingId = booking.id
    await updateTestBookingStatus(bookingId, 'confirmed')
    qrCode = await getOrSetBookingQRCode(bookingId)
  })

  test.afterEach(async () => {
    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)
  })

  test('expediteur et voyageur voient le meme QR, seul le voyageur voit le scan depot', async ({
    senderPage,
    travelerPage,
  }) => {
    await senderPage.goto(`/dashboard/colis/${bookingId}/qr`)
    await expect(senderPage.getByText(`Code: ${qrCode}`)).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      senderPage.locator(`a[href="/dashboard/scan/depot/${bookingId}"]`)
    ).toHaveCount(0)

    await travelerPage.goto(`/dashboard/colis/${bookingId}/qr`)
    await expect(travelerPage.getByText(`Code: ${qrCode}`)).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      travelerPage.locator(`a[href="/dashboard/scan/depot/${bookingId}"]`)
    ).toBeVisible()
  })

  test('page scan depot valide le QR attendu et signale un code incorrect', async ({
    travelerPage,
  }) => {
    await travelerPage.goto(
      `/dashboard/scan/depot/${bookingId}?code=${encodeURIComponent(
        qrCode.toLowerCase()
      )}`
    )

    await expect(travelerPage.locator('#qr-code')).toHaveValue(
      qrCode.toLowerCase(),
      { timeout: 15_000 }
    )
    await expect(
      travelerPage.getByText('Valide', { exact: true })
    ).toBeVisible()

    await travelerPage.locator('#qr-code').fill('SENDBOX-wrong000-0000')
    await expect(travelerPage.getByText('Incorrect')).toBeVisible()
  })

  test('page livraison est accessible seulement quand le colis est en transit', async ({
    travelerPage,
  }) => {
    await travelerPage.goto(`/dashboard/scan/livraison/${bookingId}`)
    await travelerPage.waitForURL(
      new RegExp(`/dashboard/colis/${bookingId}$`),
      {
        timeout: 15_000,
      }
    )

    await updateTestBookingStatus(bookingId, 'in_transit')

    await travelerPage.goto(`/dashboard/scan/livraison/${bookingId}`)
    await expect(
      travelerPage.getByRole('heading', { name: /confirmation de livraison/i })
    ).toBeVisible({ timeout: 15_000 })
    await expect(travelerPage.locator('#photo')).toBeVisible()
    await expect(
      travelerPage.getByRole('button', { name: /valider la livraison/i })
    ).toBeVisible()
  })
})
