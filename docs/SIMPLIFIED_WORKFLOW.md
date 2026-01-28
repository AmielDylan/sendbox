# 🚀 Workflow Simplifié: GitHub + Vercel

## 🎯 Approche adoptée

### **Avant (compliqué):**
```
git push/merge
    ↓
GitHub Actions build & déploie
    ↓
Vercel reçoit le déploiement
```
❌ Double déploiement = lent et compliqué

### **Maintenant (simplifié):**
```
git push/merge
    ↓
GitHub Actions: teste & valide ✅
    ↓
Vercel: déploie automatiquement
```
✅ Chacun fait son travail correctement

---

## 📊 Ce que fait chaque workflow

### 1. **CI Workflow** (`.github/workflows/ci.yml`)
**Quand:** À chaque push/PR
**Vérifie:**
- ✅ Code format (ESLint + Prettier)
- ✅ Tests unitaires
- ✅ Tests intégration
- ✅ Build TypeScript

**Résultat:** Si ❌ échoue = la PR peut pas être mergée

### 2. **Pre-Deploy Quality Checks** (`.github/workflows/deploy.yml`)
**Quand:** Seulement sur `main` (après merge)
**Vérifie:**
- ✅ Tous les tests
- ✅ TypeScript compile
- ✅ Build Next.js fonctionne

**Résultat:** ✅ = Vercel déploie automatiquement

---

## 🔗 Flux complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Développement sur une branche                             │
│    git checkout -b feat/my-feature                           │
│    # ... modifications ...                                   │
│    git push -u origin feat/my-feature                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GitHub CI s'exécute automatiquement                       │
│    • Lint                                                   │
│    • Tests unitaires                                        │
│    • Tests intégration                                      │
│    • Build TypeScript                                       │
│                                                             │
│ Si ✅ tout passe:                                            │
│    → Bouton "Merge" activé ✓                                │
│ Si ❌ erreur:                                                │
│    → Impossible de merger, corrige d'abord                  │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Pull Request Review + Merge                              │
│    • Revue du code                                          │
│    • Approbation                                            │
│    • Merge vers develop                                     │
└─────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. (Optionnel) Merge develop → main                         │
│    git merge develop → main                                 │
│    git push origin main                                     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. GitHub Deploy Workflow s'exécute (main branch)           │
│    • Tests finals                                           │
│    • Build final                                            │
│    • Confirmation ✅                                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Vercel webhook reçoit le signal                          │
│    • Détecte le push sur main                               │
│    • Lance le build Vercel                                  │
│    • Déploie en production                                  │
│    • Invite de déploiement générée                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
        ✅ APPLICATION DÉPLOYÉE !
```

---

## 🔐 Secrets GitHub nécessaires

### Minimum (ce que tu dois configurer):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
```

**Où les ajouter:**
1. Va à ton repo GitHub
2. Settings > Secrets and variables > Actions
3. "New repository secret"
4. Ajoute chaque secret

**Où les trouver:**
- Vercel: Dashboard > Project > Settings > Environment Variables
- Stripe: https://dashboard.stripe.com
- Resend: https://resend.com/keys
- Supabase: https://supabase.com/dashboard

### Tokens Vercel (OPTIONNEL):

Si tu veux contrôler le déploiement Vercel depuis GitHub:
- `VERCEL_TOKEN` - Token personnel Vercel

**Mais ce n'est pas nécessaire** puisque Vercel est déjà connecté via GitHub OAuth.

---

## ✅ Comment tester le workflow

### **Test 1: Vérifier le CI (sans merger)**

```bash
# Créer une branche de test
git checkout -b test/workflow-test

# Faire un changement bénin
echo "# Test" >> README.md

# Pousser et créer une PR
git add .
git commit -m "test: verify CI workflow"
git push -u origin test/workflow-test

# Sur GitHub: créer une PR vers develop
# ↓
# Tu devrais voir la CI s'exécuter
```

**Vérifier:**
1. Va à la PR sur GitHub
2. Regarde l'onglet "Checks"
3. Tu devrais voir:
   - ✅ Lint & Format
   - ✅ Unit Tests
   - ✅ Integration Tests
   - ✅ Build & Type Check

### **Test 2: Vérifier le Pre-Deploy (sur main)**

```bash
# Après que ta branche soit mergée vers develop:
git checkout develop
git pull

# Créer une PR develop → main
# Sur GitHub: faire le merge
# ↓
# Tu devrais voir le Pre-Deploy workflow

# Vérifier:
# 1. Va à main
# 2. Clique sur le commit le plus récent
# 3. Regarde les checks
# 4. Tu devrais voir "Pre-Deploy Quality Checks" ✅
```

---

## 🐛 Troubleshooting

### "Secrets not found"
```
Erreur: "SUPABASE_URL is not defined"
Solution: Ajouter le secret manquant dans GitHub Settings
```

### "Build failed in workflow"
```
Erreur: "npm run build" échoue
Solution: 
1. Exécuter localement: npm run build
2. Fixer l'erreur
3. Pousser à nouveau
```

### "Tests passent localement mais échouent en CI"
```
Probabilité: Différence d'environnement
Solution:
1. Vérifier que les secrets sont les mêmes
2. Vérifier la version Node (20)
3. Voir les logs du workflow
```

### "Vercel ne déploie pas"
```
Probabilité: Vercel n'a pas reçu le webhook
Solution:
1. Vérifier que Vercel est connecté à GitHub
2. Vérifier Settings > Git Integration sur Vercel
3. Redéployer manuellement depuis Vercel dashboard
```

---

## 📈 Prochaines étapes

### Maintenant:
1. ✅ Ajouter les 6 secrets GitHub
2. ✅ Tester la CI sur une branche
3. ✅ Tester le pre-deploy en mergant vers main

### Après validation:
1. Pusher la branche `feat/test-vercel-deploy`
2. Créer une PR vers develop
3. Voir les workflows s'exécuter
4. Merger et observer le déploiement

### Plus tard:
1. Si tu veux plus de contrôle: ajouter des étapes au workflow
2. Si tu veux des previews: activer Vercel Preview dans GitHub
3. Si tu veux des notifications: ajouter Slack/Discord

---

## 💡 Résumé

**GitHub = Qualité (tests + lint)**
**Vercel = Déploiement (production)**

Ils travaillent ensemble:
1. GitHub teste
2. Si ✅ → Vercel déploie
3. Si ❌ → Personne ne déploie (safety)

C'est simple, efficace, et sécurisé. ✅
