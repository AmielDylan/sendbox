# 🧪 Guide: Tester le Workflow

## ✅ Checklist avant le test

- [ ] Branche `feat/test-vercel-deploy` créée
- [ ] Changements committés localement
- [ ] Tu n'as pas encore poussé vers GitHub
- [ ] Configuration Git: `git config merge.ff false` (voir `docs/GIT_MERGE_STRATEGY.md`)

---

## 🚀 Étapes pour tester

### **Étape 0: Configurer la stratégie de merge (important !)**

```bash
# Configurer pour ne pas faire de fast-forward
git config merge.ff false

# Vérifier la configuration
git config merge.ff
# Résultat attendu: false
```

Voir `docs/GIT_MERGE_STRATEGY.md` pour plus d'infos.

### **Étape 1: Ajouter les secrets GitHub**

1. Va à ton repo GitHub: https://github.com/AmielDylan/sendbox
2. Settings > Secrets and variables > Actions
3. Clique "New repository secret"
4. Ajoute chaque secret (extrais les valeurs de ton `.env.local`):

```
Secret Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://tpvjycjlzxlbrtbvyfsx.supabase.co

Secret Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Secret Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Secret Name: STRIPE_SECRET_KEY
Value: sk_test_51ScgBC...

Secret Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_51ScgBC...

Secret Name: RESEND_API_KEY
Value: re_BrGvSQJS...
```

**Vérification:**
- Après l'ajout, tu devrais voir une liste de secrets
- Chaque secret montre juste la date d'ajout (valeur cachée)

### **Étape 2: Pousser la branche de test**

```bash
cd /Users/amieladjovi/Documents/Projets/Developpement/Projets/sendbox

# Vérifier qu'on est sur la bonne branche
git branch

# Pousser
git push -u origin feat/test-vercel-deploy
```

**Attendre:** GitHub prend ~5-10 secondes pour détecter le push

### **Étape 3: Observer le CI workflow**

1. Va sur GitHub: https://github.com/AmielDylan/sendbox/actions
2. Tu devrais voir un nouveau workflow "CI - Tests & Quality" qui s'exécute
3. Attendre 2-3 minutes que les tests finissent

**Vérifier:**
- ✅ Lint & Format - PASS
- ✅ Unit Tests - PASS
- ✅ Integration Tests - PASS
- ✅ Build & Type Check - PASS

**Si ❌ error:**
- Clique sur le job qui a échoué
- Voir les logs pour corriger

### **Étape 4: Créer une Pull Request**

1. Va à https://github.com/AmielDylan/sendbox/pulls
2. Clique "New pull request"
3. Base: `develop` ← Compare: `feat/test-vercel-deploy`
4. Clique "Create pull request"

**Observer:**
- Les checks s'exécutent à nouveau (normal)
- Le PR devrait montrer ✅ tous les checks

### **Étape 5: Merger vers develop**

Si tout passe:
1. Clique "Merge pull request"
2. Attendre 30 secondes

### **Étape 5: Merger vers develop (avec --no-ff)**

```bash
git checkout develop
git pull origin develop

# Merger avec merge commit (pas de fast-forward)
git merge --no-ff feat/test-vercel-deploy

# Pousser
git push origin develop
```

**Ou sur GitHub:**
1. Clique "Merge pull request" sur la PR
2. S'il y a une option "Create a merge commit" → choisis-la
3. Confirme le merge

**Vérifier:**
- Tu devrais voir un commit de merge dans l'historique
- Le graphe Git montre la branche

```bash
# Voir le graphe de merge
git log --oneline --graph -5 develop
```

**Résultat attendu:**
```
* xxxxxxx - Merge pull request #XXX
|\
| * xxxxxxx - docs: add summary
| * xxxxxxx - docs: add workflow testing guide
| * xxxxxxx - refactor: simplify deployment
|/
* xxxxxxx - Previous commit
```

**Vérifier:**
- Le merge s'est fait
- La branche apparaît dans le graphe Git

### **Étape 6: Créer une PR develop → main (optionnel)**

Pour tester le pre-deploy workflow:

```bash
git checkout main
git pull

# Sur GitHub:
# 1. New pull request
# 2. Base: main ← Compare: develop
# 3. Create PR
# 4. Merge PR (avec --no-ff aussi)
```

**Observer:**
- Le workflow "Pre-Deploy Quality Checks" s'exécute
- Devrait prendre ~2-3 minutes
- Vercel devrait déployer automatiquement

**Vérifier sur Vercel:**
1. Va à https://vercel.com/dashboard
2. Clique sur "sendbox"
3. Devrait montrer un nouveau déploiement

---

## 📊 Résultats attendus

### Après Étape 2 (Push branche):
```
✅ CI workflow s'exécute
✅ 4 jobs: lint, unit-tests, integration-tests, build
✅ ~3-5 minutes
```

### Après Étape 3 (Observe CI):
```
✅ Lint & Format: PASS
✅ Unit Tests: 20 tests PASS
✅ Integration Tests: 7 tests PASS
✅ Build: SUCCESS
```

### Après Étape 6 (Pre-deploy):
```
✅ Pre-Deploy Quality Checks: PASS
✅ Vercel déploiement lancé
✅ ~5 minutes total
```

---

## 🐛 Troubleshooting

### "Secrets not found error"

**Symptôme:** Workflow échoue avec "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solution:**
1. Vérifier que le secret a été ajouté
2. GitHub cache les secrets: peut prendre quelques secondes
3. Attendre 1-2 minutes et réexécuter le workflow

### "Build failed"

**Symptôme:** Étape "Build & Type Check" échoue

**Solution:**
1. Vérifier les logs du workflow
2. Exécuter localement: `npm run build`
3. Si ça marche localement mais pas en CI:
   - Vérifier les variables d'environnement
   - Vérifier que tous les secrets sont présents

### "Tests fail in workflow"

**Symptôme:** Unit Tests ou Integration Tests échouent

**Solution:**
1. Les tests marchent localement?
   - `npm run test:all`
2. Si non: fixer les tests avant de merger
3. Si oui: peut être une différence d'environnement
   - Vérifier les versions (Node, npm)
   - Vérifier les secrets d'env

### "Merge bloqué"

**Symptôme:** Bouton merge est grisé

**Solution:**
- Le workflow est encore en cours: attendre qu'il finisse
- Un check a échoué: fixer l'erreur
- Branche est pas à jour: faire "Update branch"

---

## ✨ Après test réussi

Si tout fonctionne:

1. **Nettoyer:**
   ```bash
   git branch -d feat/test-vercel-deploy
   git push origin -d feat/test-vercel-deploy
   ```

2. **Mettre à jour la doc:**
   - Ajouter les screenshots du workflow
   - Documenter le résultat

3. **Continuer avec develop:**
   - Push ta prochaine branche
   - Faire des PR
   - Laisser les workflows valider
   - Merger quand ✅

---

## 📝 Logs à conserver

Après un test réussi, prendre des screenshots de:

1. ✅ Le workflow CI complètement vert
2. ✅ Le pre-deploy workflow (si tu arrives à main)
3. ✅ Le déploiement Vercel (settings > deployments)

Ces infos aident pour documenter la mise en place.

---

## 🎯 C'est fait !

Si tous les tests passent, tu as:
- ✅ CI workflow qui teste à chaque PR
- ✅ Pre-Deploy workflow qui valide avant production
- ✅ Vercel qui déploie automatiquement
- ✅ Système de déploiement sain et sécurisé

Bravo ! 🚀
