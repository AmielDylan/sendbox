#!/usr/bin/env tsx
/**
 * Scripts de test pour déclencher les événements Stripe
 * 
 * Usage:
 *   npx tsx scripts/stripe-test-events.ts payment_succeeded
 *   npx tsx scripts/stripe-test-events.ts payment_failed
 *   npx tsx scripts/stripe-test-events.ts refund
 *   npx tsx scripts/stripe-test-events.ts all
 */

import { spawn } from 'child_process'

const EVENTS = {
  payment_succeeded: 'payment_intent.succeeded',
  payment_failed: 'payment_intent.payment_failed',
  refund: 'charge.refunded',
} as const

type EventKey = keyof typeof EVENTS | 'all'

function triggerEvent(eventType: string) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n🎯 Déclenchement de l'événement: ${eventType}`)
    console.log('⏳ En attente...\n')
    
    const stripeProcess = spawn('stripe', ['trigger', eventType], {
      stdio: 'inherit',
      shell: true,
    })
    
    stripeProcess.on('error', (error) => {
      console.error(`❌ Erreur lors du déclenchement de ${eventType}:`, error.message)
      reject(error)
    })
    
    stripeProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(`\n✅ Événement ${eventType} déclenché avec succès!`)
        console.log('📋 Vérifiez les logs de votre serveur Next.js pour voir le traitement\n')
        resolve()
      } else {
        console.error(`\n❌ Échec du déclenchement (code ${code})`)
        reject(new Error(`Process exited with code ${code}`))
      }
    })
  })
}

async function main() {
  const eventArg = process.argv[2] as EventKey
  
  if (!eventArg) {
    console.log('📋 Scripts de test pour les événements Stripe\n')
    console.log('Usage: npx tsx scripts/stripe-test-events.ts <event>\n')
    console.log('Événements disponibles:')
    console.log('  payment_succeeded  - Simule un paiement réussi')
    console.log('  payment_failed     - Simule un paiement échoué')
    console.log('  refund             - Simule un remboursement')
    console.log('  all                - Déclenche tous les événements\n')
    console.log('Exemples:')
    console.log('  npx tsx scripts/stripe-test-events.ts payment_succeeded')
    console.log('  npx tsx scripts/stripe-test-events.ts all\n')
    process.exit(0)
  }
  
  if (eventArg === 'all') {
    console.log('🚀 Déclenchement de tous les événements Stripe...\n')
    
    for (const [key, eventType] of Object.entries(EVENTS)) {
      try {
        await triggerEvent(eventType)
        // Attendre un peu entre les événements
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Erreur pour ${key}:`, error)
      }
    }
    
    console.log('\n✅ Tous les événements ont été déclenchés!')
  } else if (eventArg in EVENTS) {
    const eventType = EVENTS[eventArg]
    try {
      await triggerEvent(eventType)
    } catch (error) {
      console.error('❌ Erreur:', error)
      process.exit(1)
    }
  } else {
    console.error(`❌ Événement inconnu: ${eventArg}`)
    console.error('Événements disponibles:', Object.keys(EVENTS).join(', '), 'all')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

