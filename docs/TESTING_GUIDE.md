# 📋 Guide des Tests

## Vue d'ensemble

Ce projet utilise **Vitest** pour les tests unitaires et d'intégration avec une couverture progressive.

## Structure des tests

```
__tests__/
├── unit/                  # Tests unitaires
│   ├── announcements.test.ts
│   ├── auth.test.ts
│   └── bookings.test.ts
├── integration/          # Tests d'intégration
│   ├── auth-flow.test.ts
│   └── announcements-flow.test.ts
└── setup/               # Configuration des tests
    └── test-utils.ts
```

## Commandes disponibles

```bash
# Exécuter tous les tests
npm run test

# Exécuter en mode watch (recharge automatique)
npm run test:ui

# Tests par catégorie
npm run test:unit          # Tests unitaires uniquement
npm run test:integration   # Tests d'intégration uniquement

# Coverage
npm run test:coverage      # Générer un rapport de couverture
```

## Écrire des tests

### Test unitaire basique

```typescript
import { describe, it, expect } from 'vitest'

describe('Mon module', () => {
  it('devrait faire quelque chose', () => {
    const result = myFunction()
    expect(result).toBe(expectedValue)
  })
})
```

### Test avec mocks

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('API Call', () => {
  it('devrait appeler l\'API', () => {
    const mockFn = vi.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
})
```

### Test d'intégration

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Flux utilisateur', () => {
  beforeEach(() => {
    // Setup avant chaque test
  })

  it('devrait compléter le flux', () => {
    // Tester un flux complet
  })
})
```

## GitHub Actions CI/CD

### Workflow CI (`.github/workflows/ci.yml`)

Exécuté sur chaque **push** et **pull request** :
- ✅ Vérification du format (ESLint, Prettier)
- ✅ Tests unitaires
- ✅ Tests d'intégration
- ✅ Build TypeScript
- ✅ Upload de couverture à Codecov

### Workflow Deploy (`.github/workflows/deploy.yml`)

Exécuté uniquement sur **main** :
- ✅ Tous les tests
- ✅ Build de production
- ✅ Déploiement sur Vercel

## Configuration Vercel requise

Ajouter les secrets GitHub Actions :
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Et les variables d'environnement :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`

## Bonnes pratiques

### ✅ À faire

- Utiliser des descriptifs clairs : `it('should validate email format')`
- Grouper avec `describe`
- Utiliser `beforeEach` pour le setup commun
- Tester un comportement à la fois
- Utiliser les mocks pour les dépendances externes

### ❌ À éviter

- Tests trop complexes
- Dépendre d'autres tests
- Utiliser des données en dur (hardcoded)
- Ignorer les erreurs edge case
- Tests flaky (non-déterministes)

## Exécution locale

```bash
# Installation
npm ci

# Tests en mode watch
npm run test

# Tests avec UI interactive
npm run test:ui

# Coverage report
npm run test:coverage
```

## Debugger les tests

```bash
# Avec node inspector
node --inspect-brk ./node_modules/.bin/vitest

# Puis ouvrir chrome://inspect
```

## Couverture minimale

Cibles recommandées :
- **Statements**: 70%+
- **Branches**: 65%+
- **Functions**: 70%+
- **Lines**: 70%+

## Troubleshooting

### Les tests prennent trop longtemps
- Utiliser `--run` pour sortir après exécution
- Vérifier les mocks (ne pas appeler les APIs réelles)

### Tests qui échouent aléatoirement
- Éviter les dépendances de temps
- Utiliser des dates mockées
- Nettoyer les timers : `vi.clearAllTimers()`

### Couverture manquante
```bash
npm run test:coverage
# Ouvrir coverage/index.html
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Jest Matchers](https://vitest.dev/api/expect.html)
Temps de chargement: _____ secondes
Erreur: Oui / Non
```

---

### Test 2: Cohérence des données lors de la navigation

**Objectif:** Vérifier qu'il n'y a plus de perte de données

**Procédure:**
1. Aller sur `/dashboard/colis` → Attendre le chargement complet
2. Noter le nombre de réservations affichées: _____
3. Aller sur `/dashboard/annonces`
4. Retourner sur `/dashboard/colis`
5. Vérifier que les données sont toujours là

**Résultat attendu:**
- ✅ Retour **INSTANTANÉ** (cache préservé)
- ✅ Même nombre de réservations
- ✅ Pas de spinner (sauf si data > 30s de stale time)

**Résultat réel:**
```
Temps de retour: _____ secondes
Données préservées: Oui / Non
Nombre de réservations: _____
```

---

### Test 3: Changement d'onglets (Tabs)

**Objectif:** Vérifier que le cache fonctionne pour les différents tabs

**Procédure:**
1. Sur `/dashboard/colis`
2. Cliquer sur "Tous" → Noter le temps: _____
3. Cliquer sur "En attente" → Noter le temps: _____
4. Revenir sur "Tous" → Noter le temps: _____

**Résultat attendu:**
- ✅ Premier clic: chargement normal (1-3s)
- ✅ Deuxième clic: chargement normal (1-3s)
- ✅ Retour sur "Tous": **INSTANTANÉ** (cache)

**Résultat réel:**
```
Temps "Tous" (1ère fois): _____ s
Temps "En attente": _____ s
Temps "Tous" (retour): _____ s
```

---

### Test 4: Multi-onglets (synchronisation)

**Objectif:** Vérifier la synchronisation via BroadcastChannel

**Procédure:**
1. Ouvrir deux onglets de l'app
2. Dans l'onglet 1: Se connecter
3. Dans l'onglet 2: Vérifier que l'utilisateur est connecté automatiquement
4. Dans l'onglet 1: Se déconnecter
5. Dans l'onglet 2: Vérifier que l'utilisateur est déconnecté automatiquement

**Résultat attendu:**
- ✅ Onglet 2 se met à jour automatiquement (connexion)
- ✅ Onglet 2 se met à jour automatiquement (déconnexion)
- ✅ Pas de désynchronisation

**Résultat réel:**
```
Synchronisation connexion: Oui / Non
Synchronisation déconnexion: Oui / Non
Délai de sync: _____ secondes
```

---

### Test 5: Gestion d'erreur

**Objectif:** Vérifier que l'UI d'erreur est claire

**Procédure:**
1. Déconnecter le Wi-Fi / Mettre en mode avion
2. Aller sur `/dashboard/colis`
3. Vérifier le message d'erreur affiché
4. Reconnecter le Wi-Fi
5. Cliquer sur "Réessayer"

**Résultat attendu:**
- ✅ Message d'erreur clair avec icône
- ✅ Bouton "Réessayer" visible
- ✅ Clic sur "Réessayer" recharge les données

**Résultat réel:**
```
Message d'erreur affiché: Oui / Non
Texte du message: _____________________________
Bouton Réessayer fonctionne: Oui / Non
```

---

### Test 6: Connexion lente (throttling)

**Objectif:** Vérifier le comportement avec connexion lente

**Procédure:**
1. Ouvrir DevTools > Network
2. Activer "Slow 3G" ou "Fast 3G"
3. Aller sur `/dashboard/colis`
4. Attendre le chargement

**Résultat attendu:**
- ✅ Spinner affiché pendant le chargement
- ✅ Pas de timeout après 5 secondes (retry automatique)
- ✅ Données chargées après retry (max 3 tentatives)

**Résultat réel:**
```
Temps total: _____ secondes
Nombre de retries visible: _____
Données chargées: Oui / Non
```

---

### Test 7: Cache DevTools (optionnel)

**Objectif:** Observer le cache React Query

**Procédure:**
1. Ajouter `<ReactQueryDevtools />` temporairement dans `app/providers.tsx`
2. Ouvrir l'app
3. Cliquer sur l'icône React Query DevTools (bas de page)
4. Observer les queries

**Résultat attendu:**
- ✅ Query `['user-bookings', 'all']` visible
- ✅ Status: fresh / stale selon le temps
- ✅ Données en cache visible

---

## 📊 Récapitulatif des résultats

| Test | Status | Temps | Notes |
|------|--------|-------|-------|
| 1. Chargement Colis | ⬜ | ___s | |
| 2. Navigation | ⬜ | ___s | |
| 3. Tabs | ⬜ | ___s | |
| 4. Multi-onglets | ⬜ | ___s | |
| 5. Erreur | ⬜ | N/A | |
| 6. Connexion lente | ⬜ | ___s | |
| 7. DevTools | ⬜ | N/A | |

**Légende:** ⬜ Non testé | ✅ Passé | ❌ Échoué

---

## 🐛 En cas de problème

### Problème: La page ne charge pas du tout

**Solution:**
1. Vérifier la console du navigateur pour les erreurs
2. Vérifier que vous êtes bien connecté
3. Vérifier que `OptimizedAuthProvider` est bien monté
4. Vérifier les logs dans la console: `[Auth] State change: ...`

### Problème: "AuthenticationRequiredError"

**Cause:** L'utilisateur n'est pas authentifié

**Solution:**
1. Se reconnecter
2. Vérifier que la session est valide dans `localStorage`
3. Vérifier les cookies Supabase

### Problème: Timeout après 5 secondes

**Cause:** Requête trop lente ou problème réseau

**Solution:**
1. Vérifier la connexion internet
2. Vérifier l'état de Supabase (dashboard)
3. Augmenter le timeout dans la page si nécessaire:
   ```typescript
   { timeout: 10000 } // 10 secondes
   ```

### Problème: Données obsolètes

**Cause:** Cache trop long

**Solution:**
1. Invalider manuellement: `queryClient.invalidateQueries({ queryKey: ['user-bookings'] })`
2. Ajuster `staleTime` dans la configuration
3. Forcer un refetch: cliquer sur "Réessayer"

---

## 🔍 Debugging

### Activer les logs

Dans `components/providers/optimized-auth-provider.tsx`, les logs sont déjà activés:
```typescript
console.log('[Auth] State change:', event, currentSession?.user?.id)
```

Dans la console, vous devriez voir:
- `[Auth] State change: SIGNED_IN user-id-xxx` → Connexion
- `[Auth] State change: TOKEN_REFRESHED user-id-xxx` → Refresh token
- `[Auth] State change: SIGNED_OUT null` → Déconnexion

### Vérifier le cache React Query

Temporairement, ajouter dans `app/providers.tsx`:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <OptimizedAuthProvider>
    {children}
  </OptimizedAuthProvider>
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

---

## ✅ Validation finale

Avant de considérer la migration réussie:

- [ ] Test 1 passé (temps < 5s)
- [ ] Test 2 passé (pas de perte de données)
- [ ] Test 3 passé (cache fonctionne)
- [ ] Test 4 passé (multi-onglets sync)
- [ ] Test 5 passé (erreur claire)
- [ ] Aucune erreur dans la console
- [ ] Build Next.js réussi
- [ ] Tests manuels en production OK

---

## 📝 Prochaines étapes

Une fois les tests validés:

1. **Migrer les autres pages**
   - Page Annonces
   - Page Messages (si besoin)
   - Pages de détails

2. **Monitoring**
   - Installer Sentry ou similaire
   - Tracker les erreurs `QueryTimeoutError`
   - Mesurer les temps de chargement

3. **Optimisations**
   - Affiner les `staleTime` selon l'usage réel
   - Ajouter des prefetch pour les pages fréquentes
   - Implémenter le service worker pour offline-first

---

**Date du test:** _______________
**Testeur:** _______________
**Version:** 1.0.0 (Option complète)
