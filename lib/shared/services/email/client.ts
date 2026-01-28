/**
 * Utilitaires pour l'envoi d'emails avec Resend
 */

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn(
    'RESEND_API_KEY is not set. Email functionality will be disabled.'
  )
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@sendbox.io'
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Sendbox Support'
const FROM_ADDRESS = FROM_EMAIL.includes('<')
  ? FROM_EMAIL
  : `${FROM_NAME} <${FROM_EMAIL}>`

// Rate limiting simple (à améliorer avec Redis en production)
const emailRateLimit = new Map<string, { count: number; resetAt: number }>()
const MAX_EMAILS_PER_DAY = 50

function checkEmailRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = emailRateLimit.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    emailRateLimit.set(userId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 }) // 24 heures
    return true
  }

  if (userLimit.count >= MAX_EMAILS_PER_DAY) {
    return false
  }

  userLimit.count++
  return true
}

interface SendEmailParams {
  to: string
  subject: string
  template:
    | 'notification'
    | 'booking_request'
    | 'booking_confirmed'
    | 'payment_received'
    | 'payment_receipt'
    | 'delivery_reminder'
  data: Record<string, any>
  useResendTemplate?: boolean // Si true, utilise un template Resend au lieu de HTML embarqué
}

/**
 * Envoie un email transactionnel
 */
export async function sendEmail(params: SendEmailParams) {
  if (!resend) {
    console.warn('Resend is not configured. Email not sent:', params.subject)
    return {
      success: false,
      error: 'Email service not configured',
    }
  }

  try {
    // Rate limiting (basé sur l'email destinataire)
    if (!checkEmailRateLimit(params.to)) {
      console.warn('Email rate limit exceeded for:', params.to)
      return {
        success: false,
        error: 'Rate limit exceeded',
      }
    }

    // Choisir entre template Resend ou HTML embarqué
    const emailPayload: any = {
      from: FROM_ADDRESS,
      to: params.to,
    }

    if (params.useResendTemplate) {
      const templateId = getResendTemplateId(params.template)

      if (isResendTemplateId(templateId)) {
        emailPayload.template = {
          id: templateId,
          variables: params.data,
        }
      } else {
        emailPayload.subject = params.subject
        emailPayload.html = getEmailTemplate(params.template, params.data)
      }
    } else {
      // Utiliser HTML embarqué (par défaut)
      emailPayload.subject = params.subject
      emailPayload.html = getEmailTemplate(params.template, params.data)
    }

    const { data, error } = await resend.emails.send(emailPayload)

    if (error && params.useResendTemplate) {
      console.warn(
        'Resend template failed, falling back to inline HTML:',
        error
      )
      const fallbackPayload = {
        from: FROM_ADDRESS,
        to: params.to,
        subject: params.subject,
        html: getEmailTemplate(params.template, params.data),
      }
      const { data: fallbackData, error: fallbackError } =
        await resend.emails.send(fallbackPayload)

      if (fallbackError) {
        console.error('Error sending fallback email:', fallbackError)
        return {
          success: false,
          error: fallbackError.message,
        }
      }

      return {
        success: true,
        id: fallbackData?.id,
      }
    }

    if (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      id: data?.id,
    }
  } catch (error: any) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue',
    }
  }
}

/**
 * Retourne l'ID du template Resend selon le type
 * Les templates doivent être créés dans le Resend Dashboard
 */
function getResendTemplateId(template: string): string {
  const templateIds: Record<string, string> = {
    booking_request: '8ab5906a-6465-4e58-8f32-038abcfb51ae',
    notification: 'notification',
    booking_confirmed: 'booking_confirmed',
    payment_received: 'payment_received',
    payment_receipt: 'payment_receipt',
    delivery_reminder: 'delivery_reminder',
  }

  return templateIds[template] || template
}

function isResendTemplateId(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value)
}

/**
 * Génère le template HTML pour un email
 */
function getEmailTemplate(template: string, data: Record<string, any>): string {
  const baseStyles = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #1F2937;
        background-color: #F9FAFB;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      }
      .header {
        background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
        color: white;
        padding: 40px 32px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .content {
        padding: 40px 32px;
        background: #ffffff;
      }
      .content h2 {
        color: #1a1a1a;
        font-size: 22px;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 20px;
        letter-spacing: -0.01em;
      }
      .content p {
        color: #4a5568;
        margin: 14px 0;
        font-size: 16px;
        line-height: 1.6;
      }
      .footer {
        padding: 32px;
        text-align: center;
        color: #718096;
        font-size: 14px;
        background: #f7fafc;
        border-top: 1px solid #e2e8f0;
      }
      .footer p {
        margin: 8px 0;
      }
      .footer strong {
        color: #4a5568;
        font-weight: 600;
      }
      .button {
        display: inline-block;
        padding: 16px 40px;
        background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        margin-top: 24px;
        font-weight: 600;
        font-size: 16px;
        letter-spacing: -0.01em;
        box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
      }
      .button:hover {
        box-shadow: 0 6px 16px rgba(13, 148, 136, 0.4);
      }
    </style>
  `

  switch (template) {
    case 'notification':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Sendbox</h1>
              </div>
              <div class="content">
                <h2>${data.title}</h2>
                <p>${data.content}</p>
                ${data.booking_id ? `<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/colis/${data.booking_id}" class="button">Voir la réservation</a>` : ''}
              </div>
              <div class="footer">
                <p>Sendbox - Covoiturage France ↔ Bénin</p>
                <p>Vous recevez cet email car vous avez une notification sur Sendbox.</p>
              </div>
            </div>
          </body>
        </html>
      `

    case 'booking_request':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nouvelle Demande de Réservation</h1>
              </div>
              <div class="content">
                <h2>Vous avez reçu une nouvelle demande</h2>
                <p>Bonjour,</p>
                <p>Un expéditeur souhaite réserver <strong>${data.KILOS_REQUESTED || data.kilos_requested} kg</strong> sur votre trajet.</p>

                <div style="margin: 28px 0; padding: 24px; background: #f0fdfa; border-radius: 8px; border-left: 4px solid #14b8a6;">
                  <h3 style="margin-top: 0; margin-bottom: 16px; color: #1a1a1a; font-size: 18px; font-weight: 600; letter-spacing: -0.01em;">Détails du trajet</h3>
                  <p style="margin: 10px 0; color: #4a5568; font-size: 16px;"><strong style="color: #1a1a1a; font-weight: 600;">Itinéraire:</strong> ${data.DEPARTURE_CITY || data.departure_city} → ${data.ARRIVAL_CITY || data.arrival_city}</p>
                  <p style="margin: 10px 0; color: #4a5568; font-size: 16px;"><strong style="color: #1a1a1a; font-weight: 600;">Poids demandé:</strong> ${data.KILOS_REQUESTED || data.kilos_requested} kg</p>
                  <p style="margin: 10px 0; color: #4a5568; font-size: 16px;"><strong style="color: #1a1a1a; font-weight: 600;">Description:</strong> ${data.PACKAGE_DESCRIPTION || data.package_description || 'Non spécifiée'}</p>
                  <p style="margin: 10px 0; color: #4a5568; font-size: 16px;"><strong style="color: #1a1a1a; font-weight: 600;">Prix estimé:</strong> ${data.TOTAL_PRICE || data.total_price || '0.00'}€</p>
                </div>

                <div style="background: #f0fdfa; border: 1px solid #99f6e4; padding: 18px; border-radius: 8px; margin: 28px 0;">
                  <p style="margin: 0; color: #0d9488; font-weight: 500; font-size: 16px;"><strong>Action requise:</strong> Acceptez ou refusez cette demande dans les 48h.</p>
                </div>

                <a href="${data.APP_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages?booking=${data.BOOKING_ID || data.booking_id}" class="button">Voir la demande</a>
              </div>
              <div class="footer">
                <p><strong>Sendbox</strong> - Covoiturage de colis France ↔ Bénin</p>
                <p>Vous recevez cet email car quelqu'un a créé une réservation sur votre trajet.</p>
              </div>
            </div>
          </body>
        </html>
      `

    case 'payment_receipt':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Paiement Confirmé</h1>
              </div>
              <div class="content">
                <h2>Votre paiement a été effectué avec succès</h2>
                <p>Bonjour,</p>
                <p>Nous confirmons que votre paiement de <strong>${data.amount}€</strong> a été effectué avec succès.</p>
                <p>Vous pouvez maintenant accéder au contrat de transport et au QR code pour le dépôt de votre colis.</p>

                <div style="margin: 30px 0; padding: 20px; background: white; border-radius: 8px;">
                  <h3>Détails du paiement</h3>
                  <p><strong>Montant:</strong> ${data.amount}€</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                  ${data.booking_id ? `<p><strong>Réservation:</strong> ${data.booking_id}</p>` : ''}
                </div>

                ${data.receiptUrl ? `<p><a href="${data.receiptUrl}" class="button">📄 Télécharger le reçu Stripe</a></p>` : ''}
                ${data.booking_id ? `<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/colis/${data.booking_id}" class="button">Voir la réservation</a>` : ''}
              </div>
              <div class="footer">
                <p>Sendbox - Covoiturage France ↔ Bénin</p>
                <p>Pour toute question, contactez-nous via votre espace personnel.</p>
              </div>
            </div>
          </body>
        </html>
      `

    case 'payment_received':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 Paiement Reçu</h1>
              </div>
              <div class="content">
                <h2>Un paiement a été reçu pour votre trajet</h2>
                <p>Bonjour,</p>
                <p>Vous avez reçu un paiement de <strong>${data.amount}€</strong> pour une réservation sur votre trajet.</p>

                <div style="margin: 30px 0; padding: 20px; background: white; border-radius: 8px;">
                  <h3>Informations importantes</h3>
                  <p>✅ Le paiement a été sécurisé par Stripe</p>
                  <p>⏳ Les fonds seront versés après la livraison confirmée</p>
                  <p>📦 L'expéditeur peut maintenant déposer son colis</p>
                </div>

                ${data.booking_id ? `<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/colis/${data.booking_id}" class="button">Voir la réservation</a>` : ''}
              </div>
              <div class="footer">
                <p>Sendbox - Covoiturage France ↔ Bénin</p>
                <p>Les fonds seront automatiquement versés sur votre compte après confirmation de la livraison.</p>
              </div>
            </div>
          </body>
        </html>
      `

    default:
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Sendbox</h1>
              </div>
              <div class="content">
                <h2>${data.title || 'Notification'}</h2>
                <p>${data.content || ''}</p>
              </div>
              <div class="footer">
                <p>Sendbox - Covoiturage France ↔ Bénin</p>
              </div>
            </div>
          </body>
        </html>
      `
  }
}
