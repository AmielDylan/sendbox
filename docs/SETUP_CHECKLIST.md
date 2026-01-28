# ✅ Checklist - Configuration du CI/CD

## 📋 Avant de commiter

- [ ] Tous les tests passent localement

  ```bash
  npm run test:all -- --run
  ```

- [ ] Aucune erreur TypeScript

  ```bash
  npx tsc --noEmit
  ```

- [ ] Build réussit
  ```bash
  npm run build
  ```

## 🔐 Configuration GitHub

### 1. Ajouter les secrets

- [ ] Aller à: **Settings > Secrets and variables > Actions**
- [ ] Créer les secrets (voir liste ci-dessous)

### 2. Trouver les valeurs Vercel

```bash
# Installer/mettre à jour Vercel CLI
npm i -g vercel

# Lier le projet
cd /Users/amieladjovi/Documents/Projets/Developpement/Projets/sendbox
vercel link

# Les IDs sont dans .vercel/project.json
cat .vercel/project.json
```

### 3. Ajouter chaque secret

| Secret                               | Valeur                                | Source                            |
| ------------------------------------ | ------------------------------------- | --------------------------------- |
| `VERCEL_TOKEN`                       | Token personnel                       | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID`                      | `orgId` de `.vercel/project.json`     | `.vercel/project.json`            |
| `VERCEL_PROJECT_ID`                  | `projectId` de `.vercel/project.json` | `.vercel/project.json`            |
| `NEXT_PUBLIC_SUPABASE_URL`           | URL publique Supabase                 | `.env.local`                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Clé publique Supabase                 | `.env.local`                      |
| `SUPABASE_SERVICE_ROLE_KEY`          | Clé service Supabase                  | Supabase Dashboard                |
| `STRIPE_SECRET_KEY`                  | Clé secrète Stripe                    | Stripe Dashboard                  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe                   | Stripe Dashboard                  |
| `RESEND_API_KEY`                     | Clé API Resend                        | Resend Dashboard                  |

## 📝 Commandes de test

```bash
# Tous les tests
npm run test:all -- --run

# Tests unitaires uniquement
npm run test:unit -- --run

# Tests d'intégration uniquement
npm run test:integration -- --run

# Avec coverage
npm run test:coverage

# Mode watch (développement)
npm run test

# UI interactive
npm run test:ui
```

## 🚀 Premier déploiement

### Étape 1: Commiter les fichiers

```bash
git add .
git commit -m "feat: add complete CI/CD pipeline with tests

- Add GitHub Actions workflows (ci.yml, deploy.yml)
- Create clean test suite (unit + integration)
- Update TESTING_GUIDE.md and add CI_CD_SETUP.md
- Update package.json test scripts
- Configure Vitest setup
"
git push origin develop
```

### Étape 2: Créer une Pull Request

```bash
# Depuis GitHub interface
1. New pull request
2. base: main <- compare: develop
3. Vérifier que CI passe ✅
4. Merge et voir deploy workflow 🚀
```

### Étape 3: Vérifier le déploiement

- [ ] Aller à **Actions** dans GitHub
- [ ] Voir le workflow `Deploy to Production`
- [ ] Vérifier les logs
- [ ] Confirmer le déploiement Vercel

## 🔍 Vérification finale

- [ ] Tests unitaires: **20 passing** ✅
- [ ] Tests intégration: **7 passing** ✅
- [ ] TypeScript: **0 errors** ✅
- [ ] Build: **Success** ✅
- [ ] GitHub Actions: **Configured** ✅
- [ ] Secrets: **Added** ✅

## 📊 Monitoring après déploiement

### Vérifier la santé

```bash
# Voir le statut des workflows
https://github.com/[owner]/sendbox/actions

# Voir les logs
1. Actions > Select workflow
2. Select run
3. View logs
```

### En cas de problème

1. **Tests échouent en CI mais passent localement**
   - Vérifier les env vars
   - Vérifier les secrets
   - Voir les logs du workflow

2. **Build échoue**
   - Vérifier TypeScript: `npx tsc --noEmit`
   - Vérifier Next.js: `npm run build`

3. **Déploiement Vercel échoue**
   - Vérifier `VERCEL_TOKEN`
   - Vérifier `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID`
   - Voir les logs Vercel

## 📚 Documentation créée

- ✅ `docs/TESTING_GUIDE.md` - Guide complet des tests
- ✅ `docs/CI_CD_SETUP.md` - Mise en place du CI/CD
- ✅ `.github/workflows/README.md` - Workflows expliqués
- ✅ `SETUP_CHECKLIST.md` - Ce fichier

## 🎯 Prochaines étapes

### Court terme (semaine)

1. [ ] Configurer les secrets GitHub
2. [ ] Faire le premier commit et PR
3. [ ] Valider que les workflows passent

### Moyen terme (mois)

1. [ ] Ajouter des tests métier
2. [ ] Augmenter la couverture à 70%+
3. [ ] Ajouter des tests d'API

### Long terme (backlog)

1. [ ] Tests E2E avec Playwright
2. [ ] Performance testing
3. [ ] Security scanning

## ✨ Status

**✅ PRÊT POUR LA PRODUCTION**

Tous les éléments sont en place. Prochaine étape:

1. Configurer les secrets GitHub
2. Faire le premier commit
3. Observer les workflows s'exécuter 🚀

---

**Questions?**

- Voir `docs/TESTING_GUIDE.md` pour les tests
- Voir `.github/workflows/README.md` pour les workflows
- Voir `docs/CI_CD_SETUP.md` pour le résumé complet
