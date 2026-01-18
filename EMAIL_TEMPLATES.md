# Templates d'emails Supabase pour Sendbox

## 🎨 Couleurs de l'application

- **Primary Teal**: `#0d9488` → `#14b8a6` (gradient)
- **Teal Light**: `#f0fdfa` (backgrounds)
- **Background**: `#f5f5f5`
- **Text**: `#4a5568` (corps), `#1a1a1a` (titres)

---

## 📧 Template 1: Confirm Signup (Vérification d'email)

### Subject
```
Bienvenue sur Sendbox - Confirmez votre email 📦
```

### HTML Body

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 20px 0;
      text-align: center;
    }
    .text {
      font-size: 16px;
      line-height: 1.6;
      color: #4a5568;
      margin: 0 0 20px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.4);
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 30px 0;
    }
    .security-notice {
      background-color: #f0fdfa;
      border-left: 4px solid #14b8a6;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .security-notice p {
      margin: 0;
      font-size: 14px;
      color: #4a5568;
    }
    .footer {
      background-color: #f7fafc;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 14px;
      color: #718096;
      margin: 5px 0;
    }
    .footer-link {
      color: #0d9488;
      text-decoration: none;
    }
    .social-links {
      margin: 20px 0 10px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #718096;
      text-decoration: none;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header avec logo -->
    <div class="header">
      <img src="https://www.gosendbox.com/images/branding/logo-white.svg" alt="Sendbox" class="logo">
    </div>

    <!-- Contenu principal -->
    <div class="content">
      <h1 class="title">Bienvenue sur Sendbox ! 🎉</h1>

      <p class="text">
        Bonjour,
      </p>

      <p class="text">
        Merci de vous être inscrit sur <strong>Sendbox</strong>, la plateforme qui facilite l'envoi de colis entre voyageurs et expéditeurs.
      </p>

      <p class="text">
        Pour activer votre compte et profiter de tous nos services, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
      </p>

      <!-- Bouton CTA -->
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">
          Confirmer mon email
        </a>
      </div>

      <p class="text" style="text-align: center; font-size: 14px; color: #718096;">
        Ce lien est valable pendant <strong>24 heures</strong>
      </p>

      <div class="divider"></div>

      <!-- Notice de sécurité -->
      <div class="security-notice">
        <p>
          <strong>🔒 Sécurité :</strong> Si vous n'avez pas créé de compte sur Sendbox, vous pouvez ignorer cet email en toute sécurité.
        </p>
      </div>

      <p class="text" style="font-size: 14px; color: #718096; margin-top: 20px;">
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
        <a href="{{ .ConfirmationURL }}" style="color: #0d9488; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        Cet email a été envoyé par <strong>Sendbox</strong>
      </p>
      <p class="footer-text">
        <a href="https://www.gosendbox.com" class="footer-link">www.gosendbox.com</a>
      </p>

      <div class="social-links">
        <a href="https://www.gosendbox.com/cgu">Conditions d'utilisation</a> •
        <a href="https://www.gosendbox.com/politique-confidentialite">Confidentialité</a>
      </div>

      <p class="footer-text" style="font-size: 12px; color: #a0aec0; margin-top: 20px;">
        © 2026 Sendbox. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
```

### Confirmation URL (dans Supabase)
```
{{ .SiteURL }}/auth/callback?code={{ .Token }}&next=/dashboard?verified=true
```

---

## 📧 Template 2: Magic Link (Connexion sans mot de passe)

### Subject
```
Votre lien de connexion Sendbox 🔑
```

### HTML Body

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 20px 0;
      text-align: center;
    }
    .text {
      font-size: 16px;
      line-height: 1.6;
      color: #4a5568;
      margin: 0 0 20px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
    }
    .security-notice {
      background-color: #fff5f5;
      border-left: 4px solid #fc8181;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f7fafc;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 14px;
      color: #718096;
      margin: 5px 0;
    }
    .footer-link {
      color: #0d9488;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://www.gosendbox.com/images/branding/logo-white.svg" alt="Sendbox" class="logo">
    </div>

    <div class="content">
      <h1 class="title">Connexion à votre compte 🔐</h1>

      <p class="text">
        Bonjour,
      </p>

      <p class="text">
        Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Sendbox :
      </p>

      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">
          Se connecter à Sendbox
        </a>
      </div>

      <p class="text" style="text-align: center; font-size: 14px; color: #718096;">
        Ce lien expire dans <strong>1 heure</strong>
      </p>

      <div class="security-notice">
        <p style="margin: 0; font-size: 14px; color: #742a2a;">
          <strong>⚠️ Important :</strong> Si vous n'avez pas demandé ce lien de connexion, veuillez ignorer cet email et ne cliquez pas sur le lien.
        </p>
      </div>

      <p class="text" style="font-size: 14px; color: #718096; margin-top: 20px;">
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
        <a href="{{ .ConfirmationURL }}" style="color: #0d9488; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
    </div>

    <div class="footer">
      <p class="footer-text">
        Cet email a été envoyé par <strong>Sendbox</strong>
      </p>
      <p class="footer-text">
        <a href="https://www.gosendbox.com" class="footer-link">www.gosendbox.com</a>
      </p>
      <p class="footer-text" style="font-size: 12px; color: #a0aec0; margin-top: 20px;">
        © 2026 Sendbox. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
```

### Magic Link URL
```
{{ .SiteURL }}/auth/callback?code={{ .Token }}&next=/dashboard
```

---

## 📧 Template 3: Reset Password (Réinitialisation)

### Subject
```
Réinitialisez votre mot de passe Sendbox 🔒
```

### HTML Body

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 20px 0;
      text-align: center;
    }
    .text {
      font-size: 16px;
      line-height: 1.6;
      color: #4a5568;
      margin: 0 0 20px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
    }
    .security-notice {
      background-color: #fff5f5;
      border-left: 4px solid #fc8181;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f7fafc;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 14px;
      color: #718096;
      margin: 5px 0;
    }
    .footer-link {
      color: #0d9488;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://www.gosendbox.com/images/branding/logo-white.svg" alt="Sendbox" class="logo">
    </div>

    <div class="content">
      <h1 class="title">Réinitialisation du mot de passe 🔑</h1>

      <p class="text">
        Bonjour,
      </p>

      <p class="text">
        Vous avez demandé à réinitialiser le mot de passe de votre compte Sendbox.
      </p>

      <p class="text">
        Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
      </p>

      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <p class="text" style="text-align: center; font-size: 14px; color: #718096;">
        Ce lien expire dans <strong>1 heure</strong>
      </p>

      <div class="security-notice">
        <p style="margin: 0; font-size: 14px; color: #742a2a;">
          <strong>⚠️ Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.
        </p>
      </div>

      <p class="text" style="font-size: 14px; color: #718096; margin-top: 20px;">
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
        <a href="{{ .ConfirmationURL }}" style="color: #0d9488; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
    </div>

    <div class="footer">
      <p class="footer-text">
        Cet email a été envoyé par <strong>Sendbox</strong>
      </p>
      <p class="footer-text">
        <a href="https://www.gosendbox.com" class="footer-link">www.gosendbox.com</a>
      </p>
      <p class="footer-text" style="font-size: 12px; color: #a0aec0; margin-top: 20px;">
        © 2026 Sendbox. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
```

### Reset Password URL
```
{{ .SiteURL }}/reset-password?code={{ .Token }}
```

---

## 📝 Instructions d'utilisation

1. Allez dans **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Sélectionnez le template à modifier (Confirm signup, Magic Link, ou Reset Password)
3. Copiez-collez le HTML ci-dessus dans le champ **Message (Body)**
4. Mettez à jour le **Subject**
5. Configurez l'URL de confirmation appropriée
6. Cliquez sur **Save**

**Important** : Votre logo est déjà accessible à `https://www.gosendbox.com/images/branding/logo-white.svg`
