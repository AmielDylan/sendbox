/**
 * Script pour tester manuellement les webhooks KYC en local
 *
 * Usage:
 *   1. Ouvrir Supabase et copier votre user_id
 *   2. Lancer: npx tsx scripts/test-kyc-webhook.ts <USER_ID> <EVENT_TYPE>
 *
 * Exemples:
 *   npx tsx scripts/test-kyc-webhook.ts abc123 verified
 *   npx tsx scripts/test-kyc-webhook.ts abc123 requires_input
 */

async function testKYCWebhook(
  userId: string,
  eventType: 'verified' | 'requires_input' | 'processing'
) {
  const webhookUrl = 'http://localhost:3000/api/webhooks/stripe'

  const eventTypes = {
    verified: 'identity.verification_session.verified',
    requires_input: 'identity.verification_session.requires_input',
    processing: 'identity.verification_session.processing',
  }

  const mockEvents = {
    verified: {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: eventTypes.verified,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `vs_test_${Date.now()}`,
          object: 'identity.verification_session',
          status: 'verified',
          type: 'document',
          metadata: {
            user_id: userId,
            document_type: 'passport',
            document_country: 'FR',
          },
          last_error: null,
          created: Math.floor(Date.now() / 1000),
        },
      },
    },
    requires_input: {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: eventTypes.requires_input,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `vs_test_${Date.now()}`,
          object: 'identity.verification_session',
          status: 'requires_input',
          type: 'document',
          metadata: {
            user_id: userId,
            document_type: 'passport',
            document_country: 'FR',
          },
          last_error: {
            code: 'document_unverified_other',
            reason: 'Document verification failed',
          },
          created: Math.floor(Date.now() / 1000),
        },
      },
    },
    processing: {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: eventTypes.processing,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `vs_test_${Date.now()}`,
          object: 'identity.verification_session',
          status: 'processing',
          type: 'document',
          metadata: {
            user_id: userId,
            document_type: 'passport',
            document_country: 'FR',
          },
          last_error: null,
          created: Math.floor(Date.now() / 1000),
        },
      },
    },
  }

  const payload = mockEvents[eventType]

  console.log(`🚀 Testing KYC webhook: ${eventTypes[eventType]}`)
  console.log(`👤 User ID: ${userId}`)
  console.log(`📡 Sending to: ${webhookUrl}`)
  console.log('')

  try {
    // Note: En production, le webhook est protégé par signature
    // Ce script ne fonctionne QU'en développement local sans vérification de signature
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature', // Signature fictive pour dev
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      console.log('✅ Webhook envoyé avec succès')
      console.log(`📊 Status: ${response.status}`)
      const result = await response.json()
      console.log('📦 Response:', result)
    } else {
      console.error('❌ Webhook failed')
      console.error(`📊 Status: ${response.status}`)
      const error = await response.text()
      console.error('📦 Error:', error)
    }
  } catch (error) {
    console.error('❌ Request failed:', error)
  }
}

// Parse arguments
const args = process.argv.slice(2)
const userId = args[0]
const eventType = (args[1] || 'verified') as
  | 'verified'
  | 'requires_input'
  | 'processing'

if (!userId) {
  console.error('❌ Missing user_id argument')
  console.log('')
  console.log('Usage:')
  console.log('  npx tsx scripts/test-kyc-webhook.ts <USER_ID> [EVENT_TYPE]')
  console.log('')
  console.log('Event types:')
  console.log('  - verified (default)')
  console.log('  - requires_input')
  console.log('  - processing')
  console.log('')
  console.log('Example:')
  console.log('  npx tsx scripts/test-kyc-webhook.ts abc123 verified')
  process.exit(1)
}

testKYCWebhook(userId, eventType)
