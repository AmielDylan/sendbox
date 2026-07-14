import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
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

test.describe('Empty states V1', () => {
  let senderId: string
  let travelerId: string

  test.beforeEach(async () => {
    senderId = await getUserId(PERSONAS.sender.email)
    travelerId = await getUserId(PERSONAS.traveler.email)
    await cleanPersonaData([senderId, travelerId])
  })

  test('expediteur sans colis voit un etat vide actionnable', async ({
    senderPage,
  }) => {
    await senderPage.goto('/dashboard/colis')

    await expect(
      senderPage.getByText(/aucun colis pour le moment/i)
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      senderPage.getByText(/quand vous envoyez une demande/i)
    ).toBeVisible()
    await expect(
      senderPage.getByRole('link', { name: /trouver un voyageur/i })
    ).toBeVisible()
  })

  test('voyageur sans annonce voit un etat vide actionnable', async ({
    travelerPage,
  }) => {
    await travelerPage.goto('/dashboard/annonces')

    await expect(
      travelerPage.getByText(/aucun voyage enregistre|aucun voyage enregistré/i)
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      travelerPage.getByText(/publiez un trajet disponible/i)
    ).toBeVisible()
    await expect(
      travelerPage.getByRole('link', { name: /publier un trajet/i })
    ).toBeVisible()
  })

  test('voyageur sans demande recue voit le bon etat vide', async ({
    travelerPage,
  }) => {
    await travelerPage.goto('/dashboard/messages?tab=requests')

    await expect(travelerPage.getByText(/aucune demande active/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      travelerPage.getByText(
        /demandes de colis recues|demandes de colis reçues/i
      )
    ).toBeVisible()
  })

  test('utilisateur sans notification voit le bon etat vide', async ({
    senderPage,
  }) => {
    await senderPage.goto('/dashboard/notifications')

    await expect(senderPage.getByText(/aucune notification/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      senderPage.getByText(/les alertes importantes apparaissent ici/i)
    ).toBeVisible()
  })
})
