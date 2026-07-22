import { expect, test } from './fixtures'
import { PERSONAS } from './globalSetup'
import {
  createTestAnnouncement,
  deleteTestAnnouncements,
} from './helpers/seed-announcement'
import {
  acceptTestBooking,
  createTestBooking,
  deleteTestBookings,
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

test('Messages: un message recu apparait sans actualisation', async ({
  senderPage,
  travelerPage,
  supabaseAdmin,
}) => {
  const senderId = await getUserId(PERSONAS.sender.email)
  const travelerId = await getUserId(PERSONAS.traveler.email)
  await deleteTestBookings(senderId)
  await deleteTestAnnouncements(travelerId)

  const announcement = await createTestAnnouncement(travelerId)
  const booking = await createTestBooking(senderId, announcement.id)
  await acceptTestBooking(booking.id)
  await supabaseAdmin.from('messages').insert({
    booking_id: booking.id,
    sender_id: travelerId,
    receiver_id: senderId,
    content: 'Message initial E2E pour ouvrir la conversation',
  })
  const messageText = `Message realtime E2E ${Date.now()}`

  try {
    await senderPage.goto(`/dashboard/messages?booking=${booking.id}`)
    await travelerPage.goto(`/dashboard/messages?booking=${booking.id}`)

    const senderInput = senderPage.getByPlaceholder(/tapez votre message/i)

    await expect(senderInput).toBeVisible({
      timeout: 20_000,
    })
    await expect(
      travelerPage.getByText('Message initial E2E pour ouvrir la conversation')
    ).toBeVisible({ timeout: 20_000 })

    await senderInput.fill(messageText)
    const sendButton = senderPage.getByRole('button', {
      name: /envoyer le message/i,
    })
    await expect(sendButton).toBeEnabled({ timeout: 20_000 })
    await sendButton.click()

    await expect(senderPage.getByText(messageText)).toBeVisible({
      timeout: 15_000,
    })

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('messages')
          .select('id, sender_id, receiver_id, content')
          .eq('booking_id', booking.id)
          .eq('content', messageText)
          .maybeSingle()
        return data
      })
      .toMatchObject({
        sender_id: senderId,
        receiver_id: travelerId,
        content: messageText,
      })

    await expect(travelerPage.getByText(messageText).first()).toBeVisible({
      timeout: 20_000,
    })
  } finally {
    await supabaseAdmin.from('messages').delete().eq('booking_id', booking.id)
    await deleteTestBookings(senderId)
    await deleteTestAnnouncements(travelerId)
  }
})
