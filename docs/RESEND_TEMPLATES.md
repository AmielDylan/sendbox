# Configuration des Templates Resend

Ce document explique comment créer et configurer les templates d'emails dans Resend pour l'application Sendbox.

## Prérequis

1. Compte Resend configuré
2. Domaine `gosendbox.com` vérifié dans Resend
3. API Key configurée dans `.env.local`

## Étapes de Configuration

### 1. Accéder au Dashboard Resend

1. Se connecter à [resend.com](https://resend.com)
2. Aller dans **Emails** → **Templates** dans le menu de gauche

### 2. Créer le Template "Booking Request"

#### a. Informations de base

- **Nom du template** : `Booking Request`
- **Identifiant** : `booking_request`
- **Description** : Template pour notifier un voyageur d'une nouvelle demande de réservation

#### b. Variables du template

Le template utilisera les variables suivantes :

```typescript
{
  KILOS_REQUESTED: number          // Poids demandé (ex: 5)
  TOTAL_PRICE: number              // Prix total (ex: 25.50)
  PACKAGE_DESCRIPTION?: string     // Description du colis (optionnel)
  DEPARTURE_CITY: string           // Ville de départ (ex: "Paris")
  ARRIVAL_CITY: string             // Ville d'arrivée (ex: "Cotonou")
  BOOKING_ID: string               // ID de la réservation pour le lien
  APP_URL: string                  // URL de l'application
}
```

**Note importante** : Resend recommande d'utiliser des noms de variables en MAJUSCULES pour les distinguer du contenu.

#### c. Contenu HTML du template

**Sujet de l'email** : `Nouvelle demande de réservation - {{{DEPARTURE_CITY}}} → {{{ARRIVAL_CITY}}}`

**Corps HTML** :

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 32px 24px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .content {
        padding: 32px 24px;
        background: #ffffff;
      }
      .content h2 {
        color: #1f2937;
        font-size: 20px;
        margin-top: 0;
        margin-bottom: 16px;
      }
      .content p {
        color: #4b5563;
        margin: 12px 0;
      }
      .details-box {
        margin: 24px 0;
        padding: 20px;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 4px solid #2563eb;
      }
      .details-box h3 {
        margin-top: 0;
        color: #1f2937;
        font-size: 16px;
      }
      .details-box p {
        margin: 8px 0;
        color: #374151;
      }
      .details-box strong {
        color: #1f2937;
      }
      .action-box {
        background: #eff6ff;
        padding: 16px;
        border-radius: 8px;
        margin: 24px 0;
      }
      .action-box p {
        margin: 0;
        color: #1e40af;
        font-weight: 500;
      }
      .button {
        display: inline-block;
        padding: 14px 28px;
        background: #2563eb;
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        margin-top: 24px;
        font-weight: 600;
        transition: background 0.2s;
      }
      .button:hover {
        background: #1d4ed8;
      }
      .footer {
        padding: 24px;
        text-align: center;
        color: #6b7280;
        font-size: 13px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
      }
      .footer p {
        margin: 8px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📦 Nouvelle Demande de Réservation</h1>
      </div>
      <div class="content">
        <h2>Vous avez reçu une nouvelle demande !</h2>
        <p>Bonjour,</p>
        <p>Un expéditeur souhaite réserver <strong>{{{KILOS_REQUESTED}}} kg</strong> sur votre trajet.</p>

        <div class="details-box">
          <h3>Détails du trajet</h3>
          <p><strong>📍 Itinéraire :</strong> {{{DEPARTURE_CITY}}} → {{{ARRIVAL_CITY}}}</p>
          <p><strong>📦 Poids demandé :</strong> {{{KILOS_REQUESTED}}} kg</p>
          <p><strong>📝 Description :</strong> {{{PACKAGE_DESCRIPTION | default: "Non spécifiée"}}}</p>
          <p><strong>💰 Prix estimé :</strong> {{{TOTAL_PRICE}}} €</p>
        </div>

        <div class="action-box">
          <p><strong>⚡ Action requise :</strong> Acceptez ou refusez cette demande dans les 48h.</p>
        </div>

        <a href="{{{APP_URL}}}/dashboard/messages?booking={{{BOOKING_ID}}}" class="button">Voir la demande</a>
      </div>
      <div class="footer">
        <p><strong>Sendbox</strong> - Covoiturage de colis France ↔ Bénin</p>
        <p>Vous recevez cet email car quelqu'un a créé une réservation sur votre trajet.</p>
      </div>
    </div>
  </body>
</html>
```

**Notes sur la syntaxe** :
- **Triple accolades `{{{VARIABLE}}}`** : Utilisé pour échapper le HTML et afficher la valeur brute
- **Valeurs par défaut** : `{{{VARIABLE | default: "Valeur par défaut"}}}`
- **Maximum 20 variables** par template dans Resend

### 3. Tester le Template

Dans le dashboard Resend, utilisez la fonction "Test" avec ces valeurs :

```json
{
  "KILOS_REQUESTED": 5,
  "TOTAL_PRICE": 25.50,
  "PACKAGE_DESCRIPTION": "Vêtements et produits alimentaires",
  "DEPARTURE_CITY": "Paris",
  "ARRIVAL_CITY": "Cotonou",
  "BOOKING_ID": "test-booking-id-123",
  "APP_URL": "http://localhost:3000"
}
```

### 4. Obtenir l'ID du Template

Une fois le template créé :

1. Aller dans la liste des templates
2. Copier l'**ID du template** (format : `re_xxxxx`)
3. Mettre à jour le fichier `lib/shared/services/email/client.ts` :

```typescript
function getResendTemplateId(template: string): string {
  const templateIds: Record<string, string> = {
    booking_request: 're_xxxxx', // ⬅️ Remplacer par l'ID réel
    // ... autres templates
  }
  return templateIds[template] || template
}
```

### 5. Activer l'Utilisation des Templates

Dans `lib/core/notifications/actions.ts`, activer l'option lors de l'envoi :

```typescript
await sendEmail({
  to: authUser.user.email,
  subject: params.title,
  template: 'booking_request',
  data: emailData,
  useResendTemplate: true, // ⬅️ Activer pour utiliser le template Resend
})
```

## Gestion via l'API Resend (Context7)

Actions disponibles sur les templates :

- **Lister les templates** : `GET /templates`
  - Pagination via `limit`, `after`, `before`
- **Récupérer un template** : `GET /templates/{id}` (ID ou alias)
- **Supprimer un template** : `DELETE /templates/{id}`
- **Mettre à jour partiellement** : `PATCH /templates/{templateId}`
  - Champs: `name`, `html`
- **Mettre à jour complètement** : `PUT /templates/{id}`
  - Champs: `name`, `html`, `alias`, `from`, `subject`, `reply_to`, `text`, `variables`

## Variables d'Environnement

Ajouter dans `.env.local` :

```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@gosendbox.com
NEXT_PUBLIC_APP_URL=https://gosendbox.com  # ou http://localhost:3000 en dev
```

## Templates Additionnels à Créer

Vous pouvez créer d'autres templates pour :

1. **Booking Confirmed** (`booking_confirmed`)
   - Notifier l'expéditeur que sa réservation a été acceptée

2. **Payment Received** (`payment_received`)
   - Confirmer la réception du paiement

3. **Delivery Reminder** (`delivery_reminder`)
   - Rappel pour le dépôt ou la récupération du colis

## Syntaxe des Variables

Resend utilise **triple accolades** pour les variables :

- **Variables simples** : `{{{VARIABLE_NAME}}}`
- **Valeurs par défaut** : `{{{VARIABLE_NAME | default: "Valeur par défaut"}}}`
- **Noms réservés** (ne pas utiliser) : `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `RESEND_UNSUBSCRIBE_URL`, `contact`, `this`
- **Limite** : Maximum 20 variables par template

**Référence** : [Resend Templates Documentation](https://resend.com/docs/dashboard/templates/introduction)

## Avantages des Templates Resend

✅ **Modification sans redéploiement** - Changez le design sans toucher au code
✅ **Preview en temps réel** - Testez les emails directement dans Resend
✅ **Version control** - Resend garde l'historique des versions
✅ **A/B testing** - Testez plusieurs versions facilement
✅ **Meilleure délivrabilité** - Templates optimisés par Resend

## Dépannage

### Email ne part pas

1. Vérifier que le domaine est vérifié dans Resend
2. Vérifier l'API Key dans `.env.local`
3. Consulter les logs Resend Dashboard → Logs

### Variables non remplacées

1. Vérifier l'orthographe exacte des variables
2. S'assurer que les données sont bien passées dans `emailData`
3. Tester avec le bouton "Test" dans Resend

### Template non trouvé

1. Vérifier l'ID du template dans `getResendTemplateId()`
2. S'assurer que le template est publié (status: Published)

## Documentation Resend

- [Templates Documentation](https://resend.com/docs/dashboard/templates/introduction)
- [Templates API: List](https://resend.com/docs/api-reference/templates/list-templates)
- [Templates API: Get](https://resend.com/docs/api-reference/templates/get-template)
- [Templates API: Update](https://resend.com/docs/api-reference/templates/update-template)
- [Handlebars Syntax](https://resend.com/docs/dashboard/templates/syntax)
