/**
 * Script de reset Stripe Connect
 * - Supprime tous les comptes Stripe Connect liés aux profils
 * - Réinitialise les champs Stripe + payout dans profiles
 *
 * Usage:
 *   npx tsx scripts/maintenance/reset-stripe-connect.ts
 *   npx tsx scripts/maintenance/reset-stripe-connect.ts --confirm
 *   npx tsx scripts/maintenance/reset-stripe-connect.ts --confirm --dry-run
 *   npx tsx scripts/maintenance/reset-stripe-connect.ts --confirm --allow-live
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
  console.error("❌ Variables d'environnement manquantes:")
  if (!SUPABASE_URL) console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY)
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  if (!STRIPE_SECRET_KEY) console.error('   - STRIPE_SECRET_KEY')
  process.exit(1)
}

const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')
const dryRun = args.includes('--dry-run')
const allowLive = args.includes('--allow-live')
const skipStripe = args.includes('--skip-stripe')

if (STRIPE_SECRET_KEY.startsWith('sk_live') && !allowLive && !dryRun) {
  console.error(
    '❌ Clé Stripe LIVE détectée. Ajoutez --allow-live pour continuer.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
})

function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(message, answer => {
      rl.close()
      resolve(answer.trim().toUpperCase() === 'OUI')
    })
  })
}

async function fetchConnectAccountIds(): Promise<string[]> {
  const ids: string[] = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .not('stripe_connect_account_id', 'is', null)
      .range(from, from + pageSize - 1)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    for (const row of data) {
      const id = row?.stripe_connect_account_id
      if (id) ids.push(id)
    }

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return Array.from(new Set(ids))
}

async function deleteStripeAccounts(accountIds: string[]): Promise<void> {
  if (skipStripe) {
    console.log('ℹ️ Suppression Stripe ignorée (--skip-stripe)')
    return
  }

  if (accountIds.length === 0) {
    console.log('ℹ️ Aucun compte Stripe Connect à supprimer.')
    return
  }

  for (const accountId of accountIds) {
    if (dryRun) {
      console.log(`🧪 [DRY RUN] Supprimer le compte Stripe: ${accountId}`)
      continue
    }

    try {
      await stripe.accounts.del(accountId)
      console.log(`✅ Compte Stripe supprimé: ${accountId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`⚠️ Échec suppression Stripe ${accountId}: ${message}`)
    }
  }
}

async function resetProfiles(): Promise<void> {
  if (dryRun) {
    console.log(
      '🧪 [DRY RUN] Réinitialisation des champs Stripe/payout dans profiles'
    )
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_connect_account_id: null,
      stripe_payouts_enabled: false,
      stripe_onboarding_completed: false,
      stripe_requirements: null,
      payout_method: null,
      payout_status: null,
      wallet_operator: null,
      wallet_phone: null,
      wallet_verified_at: null,
      wallet_otp_code: null,
      wallet_otp_expires_at: null,
    } as any)
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    throw error
  }

  console.log('✅ Champs Stripe/payout réinitialisés dans profiles')
}

async function main() {
  console.log('🧹 Reset Stripe Connect & profils\n')

  if (dryRun) {
    console.log('🧪 Mode DRY RUN activé - aucune suppression effectuée\n')
  }

  const accountIds = await fetchConnectAccountIds()
  console.log(`🔎 Comptes Stripe Connect trouvés: ${accountIds.length}`)

  if (!confirmFlag && !dryRun) {
    const confirmed = await askConfirmation(
      '\n⚠️ Cette action supprime tous les comptes Stripe Connect et réinitialise les profils.\nTapez "OUI" pour confirmer: '
    )
    if (!confirmed) {
      console.log('\n❌ Opération annulée.')
      return
    }
  }

  console.log('\n🚀 Suppression des comptes Stripe...')
  await deleteStripeAccounts(accountIds)

  console.log('\n🚀 Réinitialisation des profils...')
  await resetProfiles()

  console.log('\n✨ Reset Stripe Connect terminé.')
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
