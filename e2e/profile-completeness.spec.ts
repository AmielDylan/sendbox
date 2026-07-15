import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import { createE2EAdminClient } from './helpers/supabase-admin'

test.describe('Profil complet obligatoire V1', () => {
  test('redirige un utilisateur sans prenom ou nom vers son profil', async ({
    senderPage,
  }) => {
    const supabase = createE2EAdminClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, firstname, lastname')
      .eq('email', PERSONAS.sender.email)
      .single()

    if (!profile?.id) {
      throw new Error(`Profile not found: ${PERSONAS.sender.email}`)
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ firstname: '', lastname: '' })
        .eq('id', profile.id)

      if (error) {
        throw new Error(`Failed to make profile incomplete: ${error.message}`)
      }

      await senderPage.goto('/dashboard/colis')
      await senderPage.waitForURL(/\/dashboard\/reglages\/profil$/, {
        timeout: 15_000,
      })
      await expect(
        senderPage.getByRole('heading', { name: /mon profil/i })
      ).toBeVisible()
      await expect(senderPage.locator('#firstname')).toBeVisible()
      await expect(senderPage.locator('#lastname')).toBeVisible()
    } finally {
      await supabase
        .from('profiles')
        .update({
          firstname: profile.firstname || PERSONAS.sender.firstname,
          lastname: profile.lastname || PERSONAS.sender.lastname,
        })
        .eq('id', profile.id)
    }
  })
})
