#!/usr/bin/env tsx
/**
 * Script pour automatiser la configuration du webhook Stripe
 *
 * Ce script lance `stripe listen` et met à jour automatiquement
 * STRIPE_WEBHOOK_SECRET dans .env.local
 *
 * Usage: npx tsx scripts/stripe-webhook-setup.ts
 */

import { spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const ENV_LOCAL_PATH = join(process.cwd(), '.env.local')
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/stripe'

// Regex pour extraire le secret du webhook depuis la sortie de stripe listen
const WEBHOOK_SECRET_REGEX = /whsec_[a-zA-Z0-9]{24,}/

function updateEnvFile(secret: string) {
  let envContent = ''

  // Lire le fichier .env.local s'il existe
  if (existsSync(ENV_LOCAL_PATH)) {
    envContent = readFileSync(ENV_LOCAL_PATH, 'utf-8')
  }

  // Vérifier si STRIPE_WEBHOOK_SECRET existe déjà
  const secretRegex = /^STRIPE_WEBHOOK_SECRET=.*$/m
  const hasSecret = secretRegex.test(envContent)

  if (hasSecret) {
    // Remplacer la valeur existante
    envContent = envContent.replace(
      secretRegex,
      `STRIPE_WEBHOOK_SECRET=${secret}`
    )
    console.log('✅ STRIPE_WEBHOOK_SECRET mis à jour dans .env.local')
  } else {
    // Ajouter la nouvelle ligne
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n'
    }
    envContent += `STRIPE_WEBHOOK_SECRET=${secret}\n`
    console.log('✅ STRIPE_WEBHOOK_SECRET ajouté dans .env.local')
  }

  writeFileSync(ENV_LOCAL_PATH, envContent, 'utf-8')
}

function startStripeListen() {
  console.log('🚀 Démarrage de stripe listen...')
  console.log(`📡 URL du webhook: ${WEBHOOK_URL}`)
  console.log('⏳ En attente du secret webhook...\n')

  const stripeProcess = spawn(
    'stripe',
    ['listen', '--forward-to', WEBHOOK_URL],
    {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
    }
  )

  let outputBuffer = ''
  let secretExtracted = false

  stripeProcess.stdout.on('data', (data: Buffer) => {
    const output = data.toString()
    process.stdout.write(output) // Afficher la sortie en temps réel

    outputBuffer += output

    // Chercher le secret webhook dans la sortie
    if (!secretExtracted) {
      const match = outputBuffer.match(WEBHOOK_SECRET_REGEX)
      if (match) {
        const secret = match[0]
        secretExtracted = true
        updateEnvFile(secret)
        console.log('\n✅ Configuration terminée!')
        console.log(
          '💡 Le secret webhook a été automatiquement ajouté à .env.local'
        )
        console.log(
          '💡 Vous pouvez maintenant redémarrer votre serveur Next.js si nécessaire\n'
        )
      }
    }
  })

  stripeProcess.stderr.on('data', (data: Buffer) => {
    process.stderr.write(data)
  })

  stripeProcess.on('error', error => {
    console.error(
      '❌ Erreur lors du lancement de stripe listen:',
      error.message
    )
    console.error('\n💡 Assurez-vous que Stripe CLI est installé:')
    console.error('   brew install stripe/stripe-cli/stripe (macOS)')
    console.error('   ou visitez https://stripe.com/docs/stripe-cli')
    process.exit(1)
  })

  stripeProcess.on('exit', code => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ stripe listen s'est terminé avec le code ${code}`)
      process.exit(code)
    }
  })

  // Gérer Ctrl+C proprement
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Arrêt de stripe listen...')
    stripeProcess.kill('SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    stripeProcess.kill('SIGTERM')
    process.exit(0)
  })
}

// Vérifier que Stripe CLI est disponible
const checkStripeCLI = spawn('stripe', ['--version'], {
  stdio: 'pipe',
  shell: false,
})

checkStripeCLI.on('error', () => {
  console.error("❌ Stripe CLI n'est pas installé ou n'est pas dans le PATH")
  console.error('\n💡 Installation:')
  console.error('   macOS: brew install stripe/stripe-cli/stripe')
  console.error('   Linux: https://stripe.com/docs/stripe-cli#install')
  console.error('   Windows: https://stripe.com/docs/stripe-cli#install')
  process.exit(1)
})

checkStripeCLI.on('exit', code => {
  if (code === 0) {
    startStripeListen()
  } else {
    console.error('❌ Impossible de vérifier la version de Stripe CLI')
    process.exit(1)
  }
})
