import { test as base, type Page } from '@playwright/test'
import * as path from 'path'
import Stripe from 'stripe'
import { createE2EAdminClient } from '../helpers/supabase-admin'
import type { SupabaseClient } from '@supabase/supabase-js'

const STATE_DIR = path.resolve(__dirname, '../../.playwright/state')

interface E2EFixtures {
  senderPage: Page
  travelerPage: Page
  adminPage: Page
  supabaseAdmin: SupabaseClient
  stripe: Stripe
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

  stripe: async ({}, use) => {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY for E2E fixture')
    await use(new Stripe(key))
  },
})

export { expect } from '@playwright/test'
