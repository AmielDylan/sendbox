# Guide: Appliquer les migrations Supabase sur le serveur distant

## 🔗 Étape 1: Vérifier le lien avec le projet distant

```bash
# Vérifier si le projet est déjà lié
npx supabase link --project-ref <YOUR_PROJECT_REF>
```

Si vous n'avez pas encore lié le projet, vous aurez besoin du `project-ref` depuis votre dashboard Supabase.

## 📤 Étape 2: Appliquer la migration `arrival_date`

```bash
# Dry-run pour voir ce qui sera appliqué (recommandé)
npx supabase db push --dry-run

# Appliquer réellement la migration
npx supabase db push
```

Cette commande va appliquer la migration `018_add_arrival_date_to_search.sql` qui ajoute le champ `arrival_date` à la fonction `search_announcements`.

## 🔍 Étape 3: Vérifier que la migration est appliquée

```bash
# Se connecter à la base distante via psql
npx supabase db remote commit

# Ou vérifier via le dashboard Supabase
# Database > Functions > search_announcements
```

## 🐛 Résolution du problème de connexion

Le problème d'écran noir après connexion était causé par:

1. **Timeouts artificiels** dans `login/page.tsx` qui retardaient la redirection
2. **Événements personnalisés** inutiles qui créaient de la confusion
3. **router.refresh()** appelé trop tôt

### ✅ Corrections appliquées:

1. **`app/(auth)/login/page.tsx`**:
   - Supprimé les `setTimeout()` artificiels
   - Supprimé l'événement custom `auth-change`
   - Utilisé `router.replace()` au lieu de `router.push()`
   - Supprimé le `router.refresh()` qui causait des problèmes

2. **`components/providers/optimized-auth-provider.tsx`**:
   - Réduit le timeout du fetch profile de 10s à 5s
   - Le `onAuthStateChange` gère automatiquement la mise à jour

### 🎯 Flux corrigé:

```
1. User clique "Se connecter"
2. signIn() est appelé (Server Action)
3. Supabase crée la session
4. router.replace('/dashboard') redirige immédiatement
5. OptimizedAuthProvider détecte SIGNED_IN via onAuthStateChange
6. Le profil est chargé automatiquement
7. Le dashboard s'affiche avec les données
```

## 🧪 Test

1. Déconnectez-vous
2. Reconnectez-vous
3. Vous devriez être redirigé vers `/dashboard` sans écran noir
4. Le profil devrait se charger dans les 2-3 secondes max

## 📝 Notes

- Le `AuthProvider` utilise `onAuthStateChange` qui est le pattern recommandé par Supabase
- La session est persistée automatiquement dans les cookies
- Le profil est chargé de manière asynchrone mais n'empêche pas l'affichage
