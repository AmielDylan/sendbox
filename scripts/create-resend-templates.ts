/**
 * Script pour créer, mettre à jour ou supprimer des templates Resend via l'API.
 *
 * Usage:
 *   npx tsx scripts/create-resend-templates.ts --action=upsert
 *   npx tsx scripts/create-resend-templates.ts --action=update
 *   npx tsx scripts/create-resend-templates.ts --action=delete --confirm-delete
 *   npx tsx scripts/create-resend-templates.ts --action=reset --confirm-delete
 *   npx tsx scripts/create-resend-templates.ts --only=booking_request
 *   npx tsx scripts/create-resend-templates.ts --dry-run
 *
 * Prérequis:
 *   - RESEND_API_KEY dans .env.local
 *   - Domaine gosendbox.com vérifié dans Resend
 *
 * Ce script:
 *   1. Met à jour les templates existants (ou les crée si besoin)
 *   2. Sauvegarde les IDs dans resend-template-ids.json
 *   3. Affiche les instructions pour mettre à jour le code
 */

import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY manquante dans .env.local')
  process.exit(1)
}

const resend = new Resend(RESEND_API_KEY)

type Action = 'upsert' | 'update' | 'delete' | 'reset'

function getArgValue(flag: string): string | undefined {
  const directMatch = process.argv.find(entry => entry.startsWith(`${flag}=`))
  if (directMatch) {
    return directMatch.slice(flag.length + 1)
  }

  const flagIndex = process.argv.indexOf(flag)
  if (flagIndex !== -1) {
    return process.argv[flagIndex + 1]
  }

  return undefined
}

function normalizeTemplateKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const actionArg = getArgValue('--action')
const deleteFlag = process.argv.includes('--delete')
const resetFlag = process.argv.includes('--reset')
const actionValues: Action[] = ['upsert', 'update', 'delete', 'reset']
const action: Action = actionValues.includes(actionArg as Action)
  ? (actionArg as Action)
  : resetFlag
    ? 'reset'
    : deleteFlag
      ? 'delete'
      : 'upsert'
const hasInvalidAction = Boolean(
  actionArg && !actionValues.includes(actionArg as Action)
)
const dryRun = process.argv.includes('--dry-run')
const confirmDelete =
  process.argv.includes('--confirm-delete') ||
  process.argv.includes('--confirm-delete-all')
const onlyArg = getArgValue('--only')
const onlyKeys = onlyArg ? onlyArg.split(',').map(normalizeTemplateKey) : null
const TEMPLATE_IDS_PATH = path.resolve(
  process.cwd(),
  'resend-template-ids.json'
)

// Template HTML pour Booking Request
const BOOKING_REQUEST_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle demande de réservation</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5;">
  <span style="display:none; font-size:1px; color:#f5f5f5; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Nouvelle demande de réservation sur votre trajet.
  </span>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f5f5; margin:0; padding:0; border-collapse:separate;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; border-collapse:separate;">
          <tr>
            <td align="center" style="background:#0d9488; background:linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding:28px 24px;">
              <img
                src="https://www.gosendbox.com/images/branding/logo-white.png"
                alt="Sendbox"
                width="150"
                height="30"
                style="display:block; border:0; outline:none; text-decoration:none; width:150px; height:30px; margin:0 auto;"
              >
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 12px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color:#1a1a1a;">
              <h1 style="margin:0 0 16px; font-size:24px; font-weight:700; text-align:center;">
                Nouvelle demande de réservation
              </h1>
              <p style="margin:0 0 14px; font-size:16px; line-height:1.6; color:#4a5568;">Bonjour,</p>
              <p style="margin:0 0 18px; font-size:16px; line-height:1.6; color:#4a5568;">
                Un expéditeur souhaite réserver <strong>{{{KILOS_REQUESTED}}} kg</strong> sur votre trajet.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;">
                <tr>
                  <td style="background-color:#f0fdfa; border-left:4px solid #14b8a6; border-radius:8px; padding:16px 18px;">
                    <p style="margin:0 0 10px; font-size:18px; font-weight:600; color:#1a1a1a;">
                      Détails du trajet
                    </p>
                    <p style="margin:0 0 6px; font-size:15px; color:#4a5568;">
                      <strong style="color:#1a1a1a;">Itinéraire :</strong> {{{DEPARTURE_CITY}}} vers {{{ARRIVAL_CITY}}}
                    </p>
                    <p style="margin:0 0 6px; font-size:15px; color:#4a5568;">
                      <strong style="color:#1a1a1a;">Poids demandé :</strong> {{{KILOS_REQUESTED}}} kg
                    </p>
                    <p style="margin:0 0 6px; font-size:15px; color:#4a5568;">
                      <strong style="color:#1a1a1a;">Description :</strong> {{{PACKAGE_DESCRIPTION}}}
                    </p>
                    <p style="margin:0; font-size:15px; color:#4a5568;">
                      <strong style="color:#1a1a1a;">Prix estimé :</strong> {{{TOTAL_PRICE}}} €
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
                <tr>
                  <td style="background-color:#f0fdfa; border:1px solid #99f6e4; border-radius:8px; padding:14px 16px;">
                    <p style="margin:0; font-size:15px; font-weight:600; color:#0d9488;">
                      Action requise : Acceptez ou refusez cette demande dans les 48h.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;">
                <tr>
                  <td align="center">
                    <a
                      href="{{{APP_URL}}}/dashboard/messages?booking={{{BOOKING_ID}}}"
                      style="background:#0d9488; background:linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:8px; font-weight:600; font-size:16px; display:inline-block;"
                    >
                      Voir la demande
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:12px; line-height:1.5; color:#718096; text-align:center;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="{{{APP_URL}}}/dashboard/messages?booking={{{BOOKING_ID}}}" style="color:#0d9488; word-break:break-all;">
                  {{{APP_URL}}}/dashboard/messages?booking={{{BOOKING_ID}}}
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#f7fafc; padding:24px 20px; border-top:1px solid #e2e8f0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <p style="margin:0 0 6px; font-size:12px; color:#718096;">
                Cet email a été envoyé par <strong style="color:#4a5568;">Sendbox</strong>
              </p>
              <p style="margin:0 0 6px; font-size:12px; color:#718096;">
                <a href="https://www.gosendbox.com" style="color:#0d9488; text-decoration:none;">www.gosendbox.com</a>
              </p>
              <p style="margin:0 0 6px; font-size:12px; color:#718096;">
                Covoiturage de colis France ↔ Bénin
              </p>
              <p style="margin:12px 0 0; font-size:11px; color:#a0aec0;">
                © 2026 Sendbox. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

type TemplateVariableConfig =
  | {
      key: string
      type: 'string'
      fallbackValue?: string
    }
  | {
      key: string
      type: 'number'
      fallbackValue?: number
    }

interface TemplateConfig {
  name: string
  alias?: string
  subject: string
  html: string
  from: string
  text?: string
  replyTo?: string | string[]
  variables: TemplateVariableConfig[]
}

// Type for Resend API template creation payload
interface ResendTemplatePayload {
  name: string
  subject: string
  html: string
  from: string
  alias?: string
  text?: string
  replyTo?: string | string[]
  variables?: TemplateVariableConfig[]
}

interface TemplateListItem {
  id: string
  name: string
  alias?: string | null
}

const templates: TemplateConfig[] = [
  // Ajoutez alias pour faciliter la résolution des templates existants.
  {
    name: 'booking_request',
    alias: 'booking_request',
    subject:
      'Nouvelle demande de réservation - {{{DEPARTURE_CITY}}} vers {{{ARRIVAL_CITY}}}',
    from: 'Sendbox <support@gosendbox.com>',
    html: BOOKING_REQUEST_HTML,
    variables: [
      { key: 'KILOS_REQUESTED', type: 'number', fallbackValue: 0 },
      { key: 'TOTAL_PRICE', type: 'string', fallbackValue: '0.00' },
      {
        key: 'PACKAGE_DESCRIPTION',
        type: 'string',
        fallbackValue: 'Non précisée',
      },
      {
        key: 'DEPARTURE_CITY',
        type: 'string',
        fallbackValue: 'Ville de départ',
      },
      { key: 'ARRIVAL_CITY', type: 'string', fallbackValue: 'Ville d’arrivée' },
      { key: 'BOOKING_ID', type: 'string', fallbackValue: 'inconnu' },
      {
        key: 'APP_URL',
        type: 'string',
        fallbackValue: 'https://www.gosendbox.com',
      },
    ],
  },
  // Vous pouvez ajouter d'autres templates ici
  // {
  //   name: 'booking_confirmed',
  //   subject: '✅ Réservation confirmée',
  //   from: 'Sendbox <support@gosendbox.com>',
  //   html: '...',
  //   variables: [...]
  // }
]

function matchesOnlyFilter(config: TemplateConfig): boolean {
  if (!onlyKeys || onlyKeys.length === 0) {
    return true
  }

  const normalizedKeys = [config.name, config.alias]
    .filter((value): value is string => Boolean(value))
    .map(normalizeTemplateKey)

  return normalizedKeys.some(key => onlyKeys.includes(key))
}

function mapTemplateVariables(
  config: TemplateConfig
): TemplateVariableConfig[] {
  return config.variables.map(variable => ({ ...variable }))
}

function buildTemplatePayload(config: TemplateConfig): ResendTemplatePayload {
  const payload: ResendTemplatePayload = {
    name: config.name,
    subject: config.subject,
    html: config.html,
    from: config.from,
    variables: mapTemplateVariables(config),
  }

  if (config.alias) {
    payload.alias = config.alias
  }

  if (config.text !== undefined) {
    payload.text = config.text
  }

  if (config.replyTo) {
    payload.replyTo = config.replyTo
  }

  return payload
}

function loadTemplateIds(): Record<string, string> {
  if (!fs.existsSync(TEMPLATE_IDS_PATH)) {
    return {}
  }

  try {
    const content = fs.readFileSync(TEMPLATE_IDS_PATH, 'utf-8')
    return JSON.parse(content) as Record<string, string>
  } catch (err) {
    console.error('❌ Impossible de lire resend-template-ids.json:', err)
    process.exit(1)
  }
}

let templateListCache: TemplateListItem[] | null = null

async function listTemplates(): Promise<TemplateListItem[]> {
  if (templateListCache) {
    return templateListCache
  }

  const templatesList: TemplateListItem[] = []
  let after: string | undefined = undefined

  while (true) {
    const result = await resend.templates.list({ limit: 100, after })

    if (result.error) {
      console.error(
        '❌ Erreur lors de la récupération des templates:',
        result.error
      )
      break
    }

    const pageItems = result.data?.data ?? []
    templatesList.push(...pageItems)

    if (!result.data?.has_more || pageItems.length === 0) {
      break
    }

    after = pageItems[pageItems.length - 1]?.id
    if (!after) {
      break
    }
  }

  templateListCache = templatesList
  return templatesList
}

async function resolveTemplateId(
  config: TemplateConfig,
  templateIds: Record<string, string>
): Promise<string | null> {
  const knownId = templateIds[config.name]
  if (knownId) {
    return knownId
  }

  const alias = config.alias || config.name
  const aliasLookup = await resend.templates.get(alias)
  if (!aliasLookup.error) {
    return aliasLookup.data?.id ?? null
  }

  if (aliasLookup.error.name !== 'not_found') {
    console.error(
      `❌ Erreur lors de la récupération du template "${alias}":`,
      aliasLookup.error
    )
    return null
  }

  const templatesList = await listTemplates()
  const targetKey = normalizeTemplateKey(alias)
  const match = templatesList.find(item => {
    const nameKey = normalizeTemplateKey(item.name)
    const aliasKey = item.alias ? normalizeTemplateKey(item.alias) : null
    return nameKey === targetKey || aliasKey === targetKey
  })

  return match?.id ?? null
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Crée un template via l'API Resend
 */
async function createTemplate(config: TemplateConfig): Promise<string | null> {
  console.log(`\n📝 Création du template "${config.name}"...`)

  try {
    // Créer le template via l'API Resend
    const result = await resend.templates.create(buildTemplatePayload(config))

    if (result.error) {
      console.error(
        `❌ Erreur lors de la création du template "${config.name}":`,
        result.error
      )
      return null
    }

    const templateId = result.data?.id

    if (!templateId) {
      console.error(`❌ Aucun ID retourné pour le template "${config.name}"`)
      return null
    }

    console.log(`✅ Template "${config.name}" créé avec succès !`)
    console.log(`   ID: ${templateId}`)

    return templateId
  } catch (err) {
    console.error(`❌ Erreur inattendue pour "${config.name}":`, err)
    return null
  }
}

/**
 * Met à jour un template via l'API Resend
 */
async function updateTemplate(
  templateId: string,
  config: TemplateConfig
): Promise<boolean> {
  console.log(
    `\n✏️ Mise à jour du template "${config.name}" (ID: ${templateId})...`
  )

  try {
    const result = await resend.templates.update(
      templateId,
      buildTemplatePayload(config)
    )

    if (result.error) {
      console.error(
        `❌ Erreur lors de la mise à jour du template "${config.name}":`,
        result.error
      )
      return false
    }

    console.log(`✅ Template "${config.name}" mis à jour avec succès !`)
    return true
  } catch (err) {
    console.error(`❌ Erreur inattendue pour "${config.name}":`, err)
    return false
  }
}

/**
 * Supprime un template via l'API Resend
 */
async function removeTemplate(
  templateId: string,
  config: TemplateConfig
): Promise<boolean> {
  console.log(
    `\n🗑️ Suppression du template "${config.name}" (ID: ${templateId})...`
  )

  try {
    const result = await resend.templates.remove(templateId)

    if (result.error) {
      console.error(
        `❌ Erreur lors de la suppression du template "${config.name}":`,
        result.error
      )
      return false
    }

    console.log(`✅ Template "${config.name}" supprimé avec succès !`)
    return true
  } catch (err) {
    console.error(`❌ Erreur inattendue pour "${config.name}":`, err)
    return false
  }
}

/**
 * Supprime tous les templates via l'API Resend
 */
async function deleteAllTemplates(
  dryRunMode: boolean
): Promise<{ deleted: number; failed: number }> {
  console.log('\n🧹 Suppression de tous les templates Resend...')

  const allTemplates = await listTemplates()

  if (allTemplates.length === 0) {
    console.log('ℹ️ Aucun template à supprimer.')
    return { deleted: 0, failed: 0 }
  }

  let deleted = 0
  let failed = 0

  for (const template of allTemplates) {
    if (dryRunMode) {
      console.log(`🧪 Suppression simulée: ${template.name} (${template.id})`)
      deleted++
    } else {
      const result = await resend.templates.remove(template.id)
      if (result.error) {
        console.error(
          `❌ Erreur suppression template "${template.name}" (${template.id}):`,
          result.error
        )
        failed++
      } else {
        console.log(`✅ Template supprimé: ${template.name} (${template.id})`)
        deleted++
      }
    }

    await sleep(500)
  }

  templateListCache = null
  return { deleted, failed }
}

/**
 * Sauvegarde les IDs des templates dans un fichier JSON
 */
function saveTemplateIds(templateIds: Record<string, string>) {
  try {
    fs.writeFileSync(
      TEMPLATE_IDS_PATH,
      JSON.stringify(templateIds, null, 2),
      'utf-8'
    )
    console.log(`\n💾 IDs des templates sauvegardés dans: ${TEMPLATE_IDS_PATH}`)
  } catch (err) {
    console.error(`❌ Erreur lors de la sauvegarde des IDs:`, err)
  }
}

/**
 * Affiche les instructions de mise à jour du code
 */
function displayUpdateInstructions(templateIds: Record<string, string>) {
  console.log('\n' + '='.repeat(70))
  console.log('📋 ÉTAPE SUIVANTE: Mettre à jour le code')
  console.log('='.repeat(70))
  console.log('')
  console.log('1. Ouvrez le fichier: lib/shared/services/email/client.ts')
  console.log('')
  console.log('2. Localisez la fonction getResendTemplateId() (ligne ~121)')
  console.log('')
  console.log(
    '3. Remplacez les valeurs par les IDs suivants (aussi dans resend-template-ids.json):'
  )
  console.log('')
  console.log('   const templateIds: Record<string, string> = {')
  Object.entries(templateIds).forEach(([name, id]) => {
    console.log(`     ${name}: '${id}',`)
  })
  console.log('   }')
  console.log('')
  console.log('4. Dans lib/core/notifications/actions.ts (ligne ~109):')
  console.log('   Décommentez: useResendTemplate: true')
  console.log('')
  console.log("5. Testez l'envoi d'email en créant une réservation")
  console.log('')
  console.log('='.repeat(70))
  console.log('')
}

async function main() {
  console.log('🚀 Gestion des templates Resend pour Sendbox\n')
  console.log('📧 Domaine: gosendbox.com')
  console.log('🔑 API Key:', RESEND_API_KEY?.slice(0, 10) + '...')
  console.log(`⚙️ Action: ${action}`)
  if (dryRun) {
    console.log('🧪 Mode dry-run activé (aucune modification distante)')
  }
  console.log('')

  if (hasInvalidAction) {
    console.error(
      `❌ Action invalide: ${actionArg}. Utilisez upsert, update, delete ou reset.`
    )
    process.exit(1)
  }

  if ((action === 'delete' || action === 'reset') && !confirmDelete) {
    console.error('❌ Suppression demandée sans --confirm-delete.')
    process.exit(1)
  }

  let templateIds = loadTemplateIds()
  const templatesToProcess = templates.filter(matchesOnlyFilter)

  if (templatesToProcess.length === 0) {
    console.error('❌ Aucun template ne correspond au filtre --only.')
    process.exit(1)
  }

  const summary = {
    created: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    failed: 0,
  }

  if (action === 'reset') {
    const deleteSummary = await deleteAllTemplates(dryRun)
    summary.deleted += deleteSummary.deleted
    summary.failed += deleteSummary.failed
    templateIds = {}

    if (summary.failed > 0 && !dryRun) {
      console.error('❌ Échec lors de la suppression complète des templates.')
      process.exit(1)
    }
  }

  const forceCreate = action === 'reset'

  for (const template of templatesToProcess) {
    const templateId = forceCreate
      ? null
      : await resolveTemplateId(template, templateIds)

    if (action === 'delete') {
      if (!templateId) {
        console.warn(
          `⚠️ Template "${template.name}" introuvable, suppression ignorée.`
        )
        summary.skipped++
      } else if (dryRun) {
        console.log(
          `🧪 Suppression simulée pour "${template.name}" (ID: ${templateId}).`
        )
        delete templateIds[template.name]
        summary.deleted++
      } else if (await removeTemplate(templateId, template)) {
        delete templateIds[template.name]
        summary.deleted++
      } else {
        summary.failed++
      }
    } else if (templateId) {
      if (dryRun) {
        console.log(
          `🧪 Mise à jour simulée pour "${template.name}" (ID: ${templateId}).`
        )
        templateIds[template.name] = templateId
        summary.updated++
      } else if (await updateTemplate(templateId, template)) {
        templateIds[template.name] = templateId
        summary.updated++
      } else if (action === 'upsert') {
        const createdId = await createTemplate(template)
        if (createdId) {
          templateIds[template.name] = createdId
          summary.created++
        } else {
          summary.failed++
        }
      } else {
        summary.failed++
      }
    } else if (action === 'update') {
      console.error(
        `❌ Template "${template.name}" introuvable pour mise à jour.`
      )
      summary.failed++
    } else if (dryRun) {
      console.log(`🧪 Création simulée pour "${template.name}".`)
      summary.created++
    } else {
      const createdId = await createTemplate(template)
      if (createdId) {
        templateIds[template.name] = createdId
        summary.created++
      } else {
        summary.failed++
      }
    }

    await sleep(1000)
  }

  // Afficher un résumé
  console.log('\n' + '='.repeat(70))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(70))
  console.log('')
  console.log(
    `✅ Créés: ${summary.created}, mis à jour: ${summary.updated}, supprimés: ${summary.deleted}, ignorés: ${summary.skipped}, échecs: ${summary.failed}`
  )

  if (!dryRun) {
    saveTemplateIds(templateIds)
  }

  if (action !== 'delete') {
    console.log('')
    Object.entries(templateIds).forEach(([name, id]) => {
      console.log(`   • ${name}: ${id}`)
    })
    console.log('')

    displayUpdateInstructions(templateIds)
  }

  if (summary.failed > 0) {
    process.exit(1)
  }

  console.log('✨ Script terminé avec succès!')
  console.log('')
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
