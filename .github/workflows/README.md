# GitHub Actions Workflows

## 📋 Vue d'ensemble

Ce répertoire contient les workflows automatisés pour CI/CD du projet Sendbox.

## 🔄 Workflows

### 1. CI Pipeline (`ci.yml`)

**Déclenché par:** 
- Push sur `main` ou `develop`
- Pull requests vers `main` ou `develop`

**Étapes:**
1. **Lint** - Vérifie ESLint et Prettier
2. **Unit Tests** - Exécute les tests unitaires
3. **Integration Tests** - Exécute les tests d'intégration
4. **Build** - Compile TypeScript et Next.js
5. **Test Summary** - Résumé final

### 2. Pre-Deploy Quality Checks (`deploy.yml`)

**Déclenché par:**
- Push sur `main` (production)
- Manuelle via workflow_dispatch

**Étapes:**
1. **Tests** - Exécute tous les tests
2. **TypeScript Check** - Vérifie les types
3. **Build** - Compile Next.js (dry run)
4. **Success Message** - Confirme que tout est OK

**Puis Vercel déploie automatiquement** (via le webhook GitHub)

**Note:** Ce workflow vérifie uniquement que tout fonctionne. Le déploiement réel est fait par Vercel (qui est déjà connecté à GitHub)

## ⚙️ Configuration requise

### Secrets GitHub Actions

**Important:** Tu n'as probablement besoin que des secrets d'environnement. Les tokens Vercel ne sont pas nécessaires puisque Vercel est déjà connecté via GitHub OAuth.

Ajouter les secrets dans `Settings > Secrets and variables > Actions` :

```
NEXT_PUBLIC_SUPABASE_URL        # URL Supabase public
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Clé Supabase publique
SUPABASE_SERVICE_ROLE_KEY       # Clé service Supabase
STRIPE_SECRET_KEY               # Clé secrète Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Clé publique Stripe
RESEND_API_KEY                  # Clé API Resend
```

**Optionnel (si tu veux contrôler le déploiement depuis GitHub):**
- `VERCEL_TOKEN` - Token Vercel (pour déploiement manuel via GitHub)

## 🚀 Utilisation

### Déclencher manuellement

1. Aller à **Actions** dans GitHub
2. Sélectionner le workflow
3. Cliquer **Run workflow**
4. Confirmer

### Voir les logs

1. Aller à **Actions**
2. Cliquer sur le workflow run
3. Cliquer sur le job pour voir les détails

### Déboguer les erreurs

**Les tests échouent:**
```bash
# Exécuter localement
npm run test:all

# Voir les détails
npm run test -- --reporter=verbose
```

**Le build échoue:**
```bash
# Vérifier TypeScript
npx tsc --noEmit

# Vérifier le build
npm run build
```

## 📊 Rapports

### Coverage

Le coverage est uploadé automatiquement à Codecov après les tests unitaires.

Voir le rapport : `https://codecov.io/gh/[owner]/[repo]`

### Test Results

Affichés directement dans le PR en tant que check.

## 🔐 Sécurité

- ✅ Les secrets ne sont jamais loggés
- ✅ Les environnements sont isolés
- ✅ Les tokens rotatifs sont à l'UID maximum
- ✅ Les PR externes ne peuvent pas accéder aux secrets

## 📝 Ajouter un nouveau workflow

1. Créer un fichier dans `.github/workflows/`
2. Copier la structure d'un workflow existant
3. Modifier les triggers et jobs
4. Commiter et pousser
5. Le workflow apparaît dans l'onglet Actions

## 🐛 Troubleshooting

### "Secrets not found"
- Vérifier que les secrets existent dans Settings
- Vérifier l'orthographe exacte
- Les secrets sont sensibles à la casse

### "Node modules not found"
- `npm ci` installe exactement les versions du lock file
- Utiliser `npm ci` plutôt que `npm install` en CI

### "Type errors on deploy"
- Vérifier `tsconfig.json`
- Vérifier que toutes les dépendances sont installées
- Vérifier les types manquants : `npm i --save-dev @types/xxx`

### Déploiement lent
- Utiliser le cache npm
- Les dépendances sont mises en cache entre les runs
- Vérifier les étapes qui prennent du temps

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Codecov Integration](https://codecov.io/docs)
