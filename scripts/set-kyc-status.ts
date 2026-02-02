/**
 * Script pour changer manuellement le statut KYC d'un utilisateur (TEST UNIQUEMENT)
 *
 * Usage:
 *   npx tsx scripts/set-kyc-status.ts <STATUS>
 *
 * Exemples:
 *   npx tsx scripts/set-kyc-status.ts approved
 *   npx tsx scripts/set-kyc-status.ts rejected
 *   npx tsx scripts/set-kyc-status.ts pending
 *   npx tsx scripts/set-kyc-status.ts incomplete
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), '.env.local') })

type TargetSelector = {
  email?: string
  userId?: string
}

async function setKYCStatus(
  targetStatus: 'pending' | 'approved' | 'rejected' | 'incomplete',
  selector: TargetSelector
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables')
    console.error(
      'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set'
    )
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log(`🔧 Setting KYC status to: ${targetStatus}`)
  console.log('')

  let targetProfile:
    | {
        id: string
        firstname: string | null
        lastname: string | null
        email: string
        kyc_status: string | null
      }
    | null = null

  if (selector.userId || selector.email) {
    const query = supabase
      .from('profiles')
      .select('id, firstname, lastname, email, kyc_status')

    const { data, error } = selector.userId
      ? await query.eq('id', selector.userId).maybeSingle()
      : await query.eq('email', selector.email as string).maybeSingle()

    if (error || !data) {
      console.error('❌ Profile not found for selector:', selector)
      process.exit(1)
    }

    targetProfile = data
  } else {
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, firstname, lastname, email, kyc_status')
      .limit(10)

    if (fetchError || !profiles || profiles.length === 0) {
      console.error('❌ Failed to fetch profiles:', fetchError)
      process.exit(1)
    }

    console.log('📋 Available profiles:')
    profiles.forEach((profile, index) => {
      console.log(
        `  ${index + 1}. ${profile.firstname} ${profile.lastname} (${profile.email}) - Status: ${profile.kyc_status || 'null'}`
      )
    })
    console.log('')

    targetProfile = profiles[0]
  }

  if (!targetProfile) {
    console.error('❌ No profile selected')
    process.exit(1)
  }

  console.log(
    `👤 Updating: ${targetProfile.firstname} ${targetProfile.lastname}`
  )

  const updateData: Record<string, unknown> = {
    kyc_status: targetStatus,
    kyc_reviewed_at: new Date().toISOString(),
  }

  if (targetStatus === 'approved') {
    updateData.kyc_rejection_reason = null
    updateData.kyc_document_type = 'passport'
    updateData.kyc_nationality = 'FR'
  } else if (targetStatus === 'rejected') {
    updateData.kyc_rejection_reason = 'Test rejection for demo purposes'
  } else if (targetStatus === 'pending') {
    updateData.kyc_submitted_at = new Date().toISOString()
    updateData.kyc_rejection_reason = null
  } else if (targetStatus === 'incomplete') {
    updateData.kyc_rejection_reason = 'Test incomplete for demo purposes'
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', targetProfile.id)

  if (updateError) {
    console.error('❌ Failed to update KYC status:', updateError)
    process.exit(1)
  }

  console.log(`✅ KYC status updated to: ${targetStatus}`)
  console.log('')
  console.log('🔄 Realtime should trigger automatically on the KYC page')
  console.log(
    '📱 Refresh http://localhost:3000/dashboard/reglages/kyc to see the change'
  )
}

// Parse arguments
const args = process.argv.slice(2)
const status = args[0] as 'pending' | 'approved' | 'rejected' | 'incomplete'

const readFlagValue = (flag: string) => {
  const index = args.indexOf(flag)
  if (index === -1) return undefined
  return args[index + 1]
}

const email = readFlagValue('--email') || readFlagValue('-e')
const userId = readFlagValue('--user-id') || readFlagValue('--id')

if (
  !status ||
  !['pending', 'approved', 'rejected', 'incomplete'].includes(status)
) {
  console.error('❌ Invalid or missing status argument')
  console.log('')
  console.log('Usage:')
  console.log(
    '  npx tsx scripts/set-kyc-status.ts <STATUS> [--email user@mail.com] [--user-id uuid]'
  )
  console.log('')
  console.log('Valid statuses:')
  console.log('  - pending')
  console.log('  - approved')
  console.log('  - rejected')
  console.log('  - incomplete')
  console.log('')
  console.log('Example:')
  console.log('  npx tsx scripts/set-kyc-status.ts approved --email user@mail.com')
  process.exit(1)
}

setKYCStatus(status, { email, userId })
