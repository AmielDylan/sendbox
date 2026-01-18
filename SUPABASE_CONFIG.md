# Configuration Supabase pour Sendbox

## 🔧 Configuration requise dans le Dashboard Supabase

### 1. Authentication > URL Configuration

#### Site URL
```
https://www.gosendbox.com
```

#### Redirect URLs (ajouter toutes ces URLs)
```
https://www.gosendbox.com/**
https://www.gosendbox.com/auth/callback
https://www.gosendbox.com/dashboard
http://localhost:3000/**
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

**Note**: Les wildcards `**` permettent d'autoriser tous les sous-chemins.

---

### 2. Email Templates

#### Confirm signup (Vérification d'email)

**Subject**: `Confirmez votre email pour Sendbox`

**Body (HTML)**:
```html
<h2>Bienvenue sur Sendbox !</h2>
<p>Merci de vous être inscrit. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
<p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
```

**Confirmation URL**:
```
{{ .SiteURL }}/auth/callback?code={{ .Token }}&next=/dashboard?verified=true
```

#### Magic Link

**Subject**: `Votre lien de connexion Sendbox`

**Body (HTML)**:
```html
<h2>Connexion à Sendbox</h2>
<p>Cliquez sur le lien ci-dessous pour vous connecter :</p>
<p><a href="{{ .ConfirmationURL }}">Se connecter</a></p>
<p>Ce lien expire dans 1 heure.</p>
<p>Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.</p>
```

**Magic Link URL**:
```
{{ .SiteURL }}/auth/callback?code={{ .Token }}&next=/dashboard
```

#### Reset Password

**Subject**: `Réinitialisation de votre mot de passe Sendbox`

**Body (HTML)**:
```html
<h2>Réinitialisation de mot de passe</h2>
<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
<p>Ce lien expire dans 1 heure.</p>
```

**Reset Password URL**:
```
{{ .SiteURL }}/reset-password?code={{ .Token }}
```

---

### 3. Authentication > Settings

#### General Settings

- **Enable email confirmations**: ✅ Activé
- **Enable email change confirmations**: ✅ Activé
- **Secure email change**: ✅ Activé (recommandé)

#### Password Settings

- **Minimum password length**: `8` (ou plus)
- **Password requirements**: Activer selon vos besoins
  - ☐ Require uppercase letters
  - ☐ Require lowercase letters
  - ☐ Require numbers
  - ☐ Require special characters

#### Session Settings

- **JWT Expiry**: `3600` (1 heure)
- **Refresh Token Lifetime**: `2592000` (30 jours)
- **Inactivity Timeout**: Laisser vide (désactivé)

---

### 4. Variables d'environnement (.env.local)

Assurez-vous d'avoir ces variables configurées :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tpvjycjlzxlbrtbvyfsx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# App URL (important pour les redirections)
NEXT_PUBLIC_APP_URL=https://www.gosendbox.com  # Production
# NEXT_PUBLIC_APP_URL=http://localhost:3000    # Development
```

---

## 🧪 Tester la configuration

### Test en local

1. Démarrer l'app en local : `npm run dev`
2. S'inscrire avec un email : http://localhost:3000/register
3. Vérifier que l'email de confirmation arrive
4. Cliquer sur le lien dans l'email
5. Vérifier la redirection vers : http://localhost:3000/dashboard?verified=true

### Test en production

1. S'inscrire avec un email : https://www.gosendbox.com/register
2. Vérifier l'email de confirmation
3. Cliquer sur le lien
4. Vérifier la redirection vers : https://www.gosendbox.com/dashboard?verified=true

---

## 🐛 Dépannage

### Erreur: "requested path is invalid"

**Cause**: L'URL de redirection n'est pas dans la liste des Redirect URLs autorisées.

**Solution**: Vérifier que toutes les URLs sont bien ajoutées dans **Authentication > URL Configuration > Redirect URLs**.

### Erreur: "Invalid redirect URL"

**Cause**: Le domaine de redirection ne correspond pas au Site URL.

**Solution**: S'assurer que le Site URL est `https://www.gosendbox.com` (sans trailing slash).

### L'email de vérification ne redirige pas correctement

**Cause**: Le template d'email utilise la mauvaise URL.

**Solution**: Vérifier que le template utilise bien :
```
{{ .SiteURL }}/auth/callback?code={{ .Token }}&next=/dashboard?verified=true
```

### La session n'est pas créée après clic sur le lien

**Cause**: La route `/auth/callback` ne traite pas correctement le code.

**Solution**: Vérifier que le fichier `app/auth/callback/route.ts` existe et fonctionne correctement.

---

## 📚 Ressources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Redirect URLs Configuration](https://supabase.com/docs/guides/auth/redirect-urls)

---

**Dernière mise à jour**: 2026-01-18
