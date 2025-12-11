# Guide de Sécurité Sendbox

Ce document décrit les mesures de sécurité implémentées dans Sendbox selon les meilleures pratiques OWASP 2024.

## OWASP Top 10 2024

### ✅ 1. Injection (SQL, NoSQL, Command, etc.)

**Protection** :
- ✅ Supabase utilise des requêtes paramétrées automatiquement
- ✅ Validation Zod stricte côté serveur pour tous les inputs
- ✅ Pas d'utilisation de `eval()` ou fonctions dangereuses
- ✅ RLS (Row Level Security) pour isolation des données

**Exemple** :
```typescript
// ✅ Sûr - Supabase échappe automatiquement
await supabase.from('bookings').select('*').eq('id', userInput)

// ❌ Éviter - Ne jamais construire des requêtes SQL manuellement
```

### ✅ 2. Broken Authentication

**Protection** :
- ✅ Supabase Auth avec JWT sécurisés
- ✅ Rate limiting sur authentification (5 tentatives / 15 min)
- ✅ Mots de passe forts requis (min 12 caractères, complexité)
- ✅ Sessions sécurisées avec cookies HttpOnly
- ✅ Vérification email obligatoire

**Rate Limiting** :
```typescript
// 5 tentatives de connexion / 15 minutes
const rateLimitResult = await authRateLimit(email)
if (!rateLimitResult.success) {
  throw new Error('Trop de tentatives')
}
```

### ✅ 3. Sensitive Data Exposure

**Protection** :
- ✅ HTTPS uniquement en production (HSTS header)
- ✅ Cookies sécurisés (HttpOnly, Secure, SameSite)
- ✅ Pas de secrets dans le code client
- ✅ Variables d'environnement pour secrets
- ✅ RLS pour isolation des données utilisateur

**Headers** :
- `Strict-Transport-Security`: Force HTTPS
- `X-Content-Type-Options: nosniff`: Empêche le MIME sniffing

### ✅ 4. XML External Entities (XXE)

**N/A** : Pas d'utilisation de XML dans l'application

### ✅ 5. Broken Access Control

**Protection** :
- ✅ RLS policies strictes sur toutes les tables
- ✅ Middleware pour vérification rôles (admin)
- ✅ Vérification ownership dans Server Actions
- ✅ Pas d'exposition d'IDs séquentiels

**Exemple RLS** :
```sql
-- Utilisateur ne peut voir que ses propres bookings
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = traveler_id);
```

### ✅ 6. Security Misconfiguration

**Protection** :
- ✅ Headers de sécurité configurés (voir ci-dessous)
- ✅ CSP (Content Security Policy) strict
- ✅ Pas de messages d'erreur verbeux en production
- ✅ Dependencies à jour (npm audit)

**Headers Configurés** :
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=(self)`
- `Content-Security-Policy`: Voir configuration complète

### ✅ 7. Cross-Site Scripting (XSS)

**Protection** :
- ✅ React échappe automatiquement le contenu
- ✅ DOMPurify pour sanitization HTML si nécessaire
- ✅ CSP headers pour bloquer les scripts inline non autorisés
- ✅ Validation stricte des inputs utilisateur

**Exemple** :
```typescript
// ✅ Sûr - React échappe automatiquement
<div>{userContent}</div>

// ✅ Si HTML nécessaire - Sanitize avec DOMPurify
import { sanitizeHTML } from '@/lib/security/xss-protection'
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userContent) }} />
```

### ✅ 8. Insecure Deserialization

**Protection** :
- ✅ Pas d'utilisation de `eval()` ou `Function()`
- ✅ Validation Zod stricte pour tous les inputs
- ✅ JSON.parse uniquement sur données validées

### ✅ 9. Using Components with Known Vulnerabilities

**Protection** :
- ✅ `npm audit` régulier
- ✅ Dependencies à jour
- ✅ Monitoring des vulnérabilités

**Commandes** :
```bash
npm audit
npm audit fix
npm outdated
```

### ✅ 10. Insufficient Logging & Monitoring

**Protection** :
- ✅ Table `admin_audit_logs` pour toutes actions admin
- ✅ Logs Supabase pour requêtes suspectes
- ✅ Rate limiting pour détecter les abus
- ✅ Alertes Stripe pour fraudes

## Headers de Sécurité

Tous les headers sont configurés dans `next.config.ts` :

- **HSTS** : Force HTTPS pendant 2 ans
- **CSP** : Restreint les sources de scripts, styles, images
- **X-Frame-Options** : Empêche le clickjacking
- **Permissions-Policy** : Contrôle l'accès aux APIs navigateur

## Rate Limiting

Implémenté dans `lib/security/rate-limit.ts` :

- **Authentification** : 5 tentatives / 15 minutes
- **API** : 100 requêtes / heure
- **Uploads** : 10 fichiers / heure
- **Actions sensibles** : 3 tentatives / heure (changement password, email)

**Pour production** : Migrer vers Upstash Redis pour un rate limiting distribué.

## Validation Upload Fichiers

Implémenté dans `lib/security/upload-validation.ts` :

- ✅ Vérification taille (max 5MB pour KYC, 2MB pour avatars)
- ✅ Vérification type MIME déclaré
- ✅ **Magic bytes** : Vérification du type réel du fichier
- ✅ Validation extension
- ✅ Vérification headers spécifiques (PDF, images)

**Exemple** :
```typescript
const validation = await validateKYCDocument(file)
if (!validation.valid) {
  return { error: validation.error }
}
```

## Protection XSS

Implémenté dans `lib/security/xss-protection.ts` :

- ✅ `sanitizeHTML()` : Nettoie HTML avec DOMPurify
- ✅ `sanitizeText()` : Nettoie texte brut
- ✅ `sanitizeURL()` : Valide et nettoie URLs

## Secrets Management

- ✅ Pas de secrets dans le code
- ✅ Variables d'environnement via `.env.local`
- ✅ `.env.local` dans `.gitignore`
- ✅ Secrets dans Vercel Environment Variables
- ✅ Rotation régulière recommandée

## Monitoring & Alerting

### À implémenter :

1. **Sentry** : Pour tracking des erreurs
   ```bash
   npm install @sentry/nextjs
   ```

2. **Logs Supabase** : Monitoring des requêtes suspectes
   - Dashboard Supabase → Logs
   - Alertes sur patterns suspects

3. **Stripe** : Alertes fraudes
   - Dashboard Stripe → Settings → Alerts
   - Configurer alertes pour transactions suspectes

## Checklist Déploiement

Avant chaque déploiement :

- [ ] `npm audit` : Aucune vulnérabilité critique
- [ ] Variables d'environnement configurées
- [ ] HTTPS activé
- [ ] Headers sécurité vérifiés
- [ ] Rate limiting activé
- [ ] Logs d'audit fonctionnels
- [ ] Backup base de données récent

## Réponse aux Incidents

En cas de compromission :

1. **Isoler** : Bannir utilisateurs suspects, désactiver fonctionnalités
2. **Analyser** : Consulter logs Supabase et audit logs
3. **Corriger** : Appliquer correctifs de sécurité
4. **Notifier** : Informer utilisateurs affectés si nécessaire
5. **Documenter** : Enregistrer l'incident et les mesures prises

## Ressources

- [OWASP Top 10 2024](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config/headers)
- [Playwright Security Testing](https://playwright.dev/docs/security)

## Contact Sécurité

Pour signaler une vulnérabilité : security@sendbox.io




