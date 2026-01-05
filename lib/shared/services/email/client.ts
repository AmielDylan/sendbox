/**
 * Utilitaires pour l'envoi d'emails avec Resend
 */

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email functionality will be disabled.')
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@sendbox.io'

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
  template: 'notification' | 'booking_confirmed' | 'payment_received' | 'payment_receipt' | 'delivery_reminder'
  data: Record<string, any>
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

    const html = getEmailTemplate(params.template, params.data)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html,
    })

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
 * Génère le template HTML pour un email
 */
function getEmailTemplate(template: string, data: Record<string, any>): string {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background: #f9fafb; }
      .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
      .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
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









