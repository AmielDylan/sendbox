/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, type Page } from '@playwright/test'
import * as path from 'path'
import { createE2EAdminClient } from '../helpers/supabase-admin'
import type { SupabaseClient } from '@supabase/supabase-js'

const STATE_DIR = path.resolve(__dirname, '../../.playwright/state')

interface E2EFixtures {
  senderPage: Page
  travelerPage: Page
  adminPage: Page
  supabaseAdmin: SupabaseClient
}

export const test = base.extend<E2EFixtures>({
  senderPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(STATE_DIR, 'sender.json'),
    })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },

  travelerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(STATE_DIR, 'traveler.json'),
    })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },

  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(STATE_DIR, 'admin.json'),
    })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },

  supabaseAdmin: async ({}, use) => {
    await use(createE2EAdminClient())
  },
})

export { expect } from '@playwright/test'
