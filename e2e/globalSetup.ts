import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { chromium } from '@playwright/test'
import { createE2EAdminClient } from './helpers/supabase-admin'

dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

const BASE_URL = 'http://localhost:3000'
const STATE_DIR = path.resolve(__dirname, '../.playwright/state')

const TEST_PASSWORD = 'TestPass123!'

export const PERSONAS = {
  sender: {
    email: 'e2e-sender@sendbox-test.com',
    firstname: 'Alice',
    lastname: 'Dupont',
    role: 'user' as const,
    kyc_status: 'approved',
    subscription_status: null,
  },
  traveler: {
    email: 'e2e-traveler@sendbox-test.com',
    firstname: 'Bob',
    lastname: 'Martin',
    role: 'user' as const,
    kyc_status: 'approved',
    subscription_status: 'active',
  },
  admin: {
    email: 'e2e-admin@sendbox-test.com',
    firstname: 'Admin',
    lastname: 'Sendbox',
    role: 'admin' as const,
    kyc_status: 'approved',
    subscription_status: null,
  },
} as const

export type PersonaKey = keyof typeof PERSONAS

async function ensureTestUser(
  supabase: ReturnType<typeof createE2EAdminClient>,
  persona: (typeof PERSONAS)[PersonaKey]
) {
  // Check if user already exists
  const { data: users } = await supabase.auth.admin.listUsers()
  const existing = users?.users.find(u => u.email === persona.email)

  let userId: string

  if (existing) {
    // Update password and keep existing user to avoid trigger issues
    await supabase.auth.admin.updateUserById(existing.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    userId = existing.id
  } else {
    // Create new user with metadata so trigger gets firstname/lastname
    const { data, error } = await supabase.auth.admin.createUser({
      email: persona.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        firstname: persona.firstname,
        lastname: persona.lastname,
      },
    })

    if (error || !data.user) {
      throw new Error(
        `Failed to create test user ${persona.email}: ${error?.message}`
      )
    }

    userId = data.user.id
    // Wait for DB trigger to create the profile row
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  // Upsert profile with correct role and KYC status
  await supabase
    .from('profiles')
    .update({
      firstname: persona.firstname,
      lastname: persona.lastname,
      role: persona.role,
      kyc_status: persona.kyc_status,
      verification_status:
        persona.kyc_status === 'approved' ? 'verified' : persona.kyc_status,
      verified_at:
        persona.kyc_status === 'approved' ? new Date().toISOString() : null,
      verified_name:
        persona.kyc_status === 'approved'
          ? `${persona.firstname} ${persona.lastname}`
          : null,
      ...(persona.subscription_status
        ? { subscription_status: persona.subscription_status }
        : {}),
    })
    .eq('id', userId)

  return userId
}

async function generateStorageState(email: string, stateFile: string) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  page.setDefaultTimeout(30_000)
  await page.goto(`${BASE_URL}/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  })
  await page.fill('#email', email)
  await page.fill('#password', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  // Admin redirects to /admin/dashboard, others to /dashboard
  await page.waitForURL(/\/(admin\/)?dashboard/, { timeout: 15_000 })

  await context.storageState({ path: stateFile })
  await browser.close()
}

export default async function globalSetup() {
  fs.mkdirSync(STATE_DIR, { recursive: true })

  const supabase = createE2EAdminClient()

  console.log('\n🔧 Setting up E2E test users...')

  for (const [key, persona] of Object.entries(PERSONAS)) {
    await ensureTestUser(supabase, persona)
    console.log(`  ✓ ${key} (${persona.email})`)
  }

  console.log('\n🔑 Generating auth storage states...')

  for (const [key, persona] of Object.entries(PERSONAS)) {
    const stateFile = path.join(STATE_DIR, `${key}.json`)
    await generateStorageState(persona.email, stateFile)
    console.log(`  ✓ ${key}.json`)
  }

  console.log('\n✅ E2E setup complete\n')
}
