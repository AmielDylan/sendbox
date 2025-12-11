#!/usr/bin/env tsx
/**
 * Script pour vérifier tous les workflows Stripe dans le projet
 * 
 * Ce script analyse le code pour identifier:
 * - Les événements webhook gérés
 * - Les appels API Stripe
 * - Les fonctions admin utilisant Stripe
 * - Les TODOs liés à Stripe
 * 
 * Usage: npx tsx scripts/check-stripe-workflows.ts
 */

import { readFileSync, existsSync } from 'fs'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

interface StripeUsage {
  file: string
  type: 'webhook' | 'api_call' | 'admin_function' | 'todo'
  description: string
  line?: number
}

const results: StripeUsage[] = []

function scanFile(filePath: string) {
  if (!existsSync(filePath)) return
  
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const relativePath = filePath.replace(process.cwd() + '/', '')
  
  // Chercher les webhooks
  if (filePath.includes('webhook')) {
    const webhookMatches = content.matchAll(/case\s+['"]([^'"]+)['"]/g)
    for (const match of webhookMatches) {
      results.push({
        file: relativePath,
        type: 'webhook',
        description: `Événement webhook: ${match[1]}`,
      })
    }
  }
  
  // Chercher les appels API Stripe
  const stripeApiCalls = [
    /stripe\.(paymentIntents|charges|refunds|transfers|payouts)\./g,
    /stripe\.customers\./g,
    /stripe\.connect\./g,
  ]
  
  stripeApiCalls.forEach((regex, index) => {
    const matches = content.matchAll(regex)
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length
      results.push({
        file: relativePath,
        type: 'api_call',
        description: `Appel API Stripe: ${match[0]}`,
        line: lineNumber,
      })
    }
  })
  
  // Chercher les fonctions admin avec Stripe
  if (filePath.includes('admin') && content.includes('stripe')) {
    const functionMatches = content.matchAll(/export\s+async\s+function\s+(\w+)/g)
    for (const match of functionMatches) {
      results.push({
        file: relativePath,
        type: 'admin_function',
        description: `Fonction admin: ${match[1]}`,
      })
    }
  }
  
  // Chercher les TODOs liés à Stripe
  const todoMatches = content.matchAll(/TODO.*stripe/gi)
  for (const match of todoMatches) {
    const lineNumber = content.substring(0, match.index).split('\n').length
    results.push({
      file: relativePath,
      type: 'todo',
      description: match[0].trim(),
      line: lineNumber,
    })
  }
}

function scanDirectory(dir: string) {
  const entries = readdirSync(dir)
  
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      // Ignorer node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) {
        scanDirectory(fullPath)
      }
    } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
      scanFile(fullPath)
    }
  }
}

function printResults() {
  console.log('📊 Analyse des workflows Stripe dans le projet\n')
  console.log('=' .repeat(60))
  
  const byType = {
    webhook: results.filter(r => r.type === 'webhook'),
    api_call: results.filter(r => r.type === 'api_call'),
    admin_function: results.filter(r => r.type === 'admin_function'),
    todo: results.filter(r => r.type === 'todo'),
  }
  
  // Webhooks
  console.log('\n🔔 Événements Webhook gérés:')
  if (byType.webhook.length === 0) {
    console.log('  ⚠️  Aucun webhook trouvé')
  } else {
    const uniqueWebhooks = [...new Set(byType.webhook.map(w => w.description))]
    uniqueWebhooks.forEach(desc => {
      console.log(`  ✅ ${desc}`)
    })
  }
  
  // Appels API
  console.log('\n📡 Appels API Stripe:')
  if (byType.api_call.length === 0) {
    console.log('  ⚠️  Aucun appel API trouvé')
  } else {
    const uniqueCalls = [...new Set(byType.api_call.map(a => a.description))]
    uniqueCalls.forEach(desc => {
      const files = byType.api_call
        .filter(a => a.description === desc)
        .map(a => `    ${a.file}${a.line ? `:${a.line}` : ''}`)
      console.log(`  ${desc}`)
      files.slice(0, 3).forEach(file => console.log(file))
      if (files.length > 3) {
        console.log(`    ... et ${files.length - 3} autres`)
      }
    })
  }
  
  // Fonctions admin
  console.log('\n👤 Fonctions Admin avec Stripe:')
  if (byType.admin_function.length === 0) {
    console.log('  ⚠️  Aucune fonction admin trouvée')
  } else {
    const uniqueFunctions = [...new Set(byType.admin_function.map(f => f.description))]
    uniqueFunctions.forEach(desc => {
      const file = byType.admin_function.find(f => f.description === desc)?.file
      console.log(`  ✅ ${desc}`)
      if (file) console.log(`    📁 ${file}`)
    })
  }
  
  // TODOs
  console.log('\n📝 TODOs liés à Stripe:')
  if (byType.todo.length === 0) {
    console.log('  ✅ Aucun TODO trouvé')
  } else {
    byType.todo.forEach(todo => {
      console.log(`  ⚠️  ${todo.description}`)
      console.log(`     📁 ${todo.file}${todo.line ? `:${todo.line}` : ''}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Résumé: ${results.length} éléments trouvés`)
  console.log(`   - ${byType.webhook.length} webhooks`)
  console.log(`   - ${byType.api_call.length} appels API`)
  console.log(`   - ${byType.admin_function.length} fonctions admin`)
  console.log(`   - ${byType.todo.length} TODOs\n`)
}

// Démarrer le scan
const srcDirs = ['app', 'lib', 'components']
srcDirs.forEach(dir => {
  const fullPath = join(process.cwd(), dir)
  if (existsSync(fullPath)) {
    scanDirectory(fullPath)
  }
})

printResults()

