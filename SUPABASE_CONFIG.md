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

#### ⚠️ IMPORTANT - Comment configurer les templates

**Dans le HTML du template** : Gardez TOUJOURS `{{ .ConfirmationURL }}` tel quel
**Dans le champ "Confirmation URL"** : Configurez l'URL de base vers `/auth/callback`

Supabase génère automatiquement l'URL complète avec tous les paramètres de sécurité (token_hash, type, etc.).

#### Confirm signup (Vérification d'email)

**Dans Supabase Dashboard → Authentication → Email Templates → Confirm signup :**

**Subject**: `Bienvenue sur Sendbox - Confirmez votre email 📦`

**Confirmation URL** (Cherchez ce champ en bas du formulaire) :
```
{{ .SiteURL }}/auth/callback
```

**Body (HTML)** : Utilisez le template professionnel de [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md#template-1-confirm-signup)

**IMPORTANT** : Dans le HTML, le lien doit rester :
```html
<a href="{{ .ConfirmationURL }}">Confirmer mon email</a>
```

#### Magic Link

**Dans Supabase Dashboard → Authentication → Email Templates → Magic Link :**

**Subject**: `Votre lien de connexion Sendbox 🔑`

**Confirmation URL** :
```
{{ .SiteURL }}/auth/callback
```

**Body (HTML)** : Utilisez le template de [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md#template-2-magic-link)

#### Reset Password

**Dans Supabase Dashboard → Authentication → Email Templates → Recovery (Change password) :**

**Subject**: `Réinitialisez votre mot de passe Sendbox 🔒`

**Confirmation URL** :
```
{{ .SiteURL }}/auth/callback
```

**Body (HTML)** : Utilisez le template de [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md#template-3-reset-password)

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

### Erreur: "both auth code and code verifier should be non-empty"

**Cause**: Vous avez remplacé `{{ .ConfirmationURL }}` par une URL manuelle dans le HTML du template.

**Solution**:
1. Dans le HTML du template, gardez `{{ .ConfirmationURL }}`
2. Configurez uniquement le champ "Confirmation URL" avec `{{ .SiteURL }}/auth/callback`
3. Supabase générera automatiquement l'URL complète avec tous les paramètres PKCE

### Erreur: "requested path is invalid"

**Cause**: L'URL de redirection n'est pas dans la liste des Redirect URLs autorisées.

**Solution**: Vérifier que toutes les URLs sont bien ajoutées dans **Authentication > URL Configuration > Redirect URLs**.

### Erreur: "Invalid redirect URL"

**Cause**: Le domaine de redirection ne correspond pas au Site URL.

**Solution**: S'assurer que le Site URL est `https://www.gosendbox.com` (sans trailing slash).

### L'email de vérification ne redirige pas correctement

**Cause**: Le template d'email utilise la mauvaise configuration.

**Solution**:
1. Dans le HTML : utilisez `{{ .ConfirmationURL }}`
2. Dans le champ "Confirmation URL" : utilisez `{{ .SiteURL }}/auth/callback`

### La session n'est pas créée après clic sur le lien

**Cause**: La route `/auth/callback` ne traite pas correctement le token.

**Solution**: Vérifier que le fichier `app/auth/callback/route.ts` utilise bien `verifyOtp` pour les tokens d'email.

---

## 📚 Ressources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Redirect URLs Configuration](https://supabase.com/docs/guides/auth/redirect-urls)

---

**Dernière mise à jour**: 2026-01-19
