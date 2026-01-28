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

async function setKYCStatus(
  targetStatus: 'pending' | 'approved' | 'rejected' | 'incomplete'
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

  // Get current user (first one we find for simplicity)
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

  // Update the first profile for demo
  const targetProfile = profiles[0]
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

if (
  !status ||
  !['pending', 'approved', 'rejected', 'incomplete'].includes(status)
) {
  console.error('❌ Invalid or missing status argument')
  console.log('')
  console.log('Usage:')
  console.log('  npx tsx scripts/set-kyc-status.ts <STATUS>')
  console.log('')
  console.log('Valid statuses:')
  console.log('  - pending')
  console.log('  - approved')
  console.log('  - rejected')
  console.log('  - incomplete')
  console.log('')
  console.log('Example:')
  console.log('  npx tsx scripts/set-kyc-status.ts approved')
  process.exit(1)
}

setKYCStatus(status)
