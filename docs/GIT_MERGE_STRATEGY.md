# 🔗 Git Merge Strategy Configuration

## Configuration: No Fast-Forward Merges

Pour que les branches mergées apparaissent dans le graphe Git, on utilise **merge commits** (pas de fast-forward).

### 🔧 Configuration locale

Ajoute cette configuration à ton projet:

```bash
# Configurer le repo pour toujours créer un merge commit
git config merge.ff false

# Vérifier la configuration
git config merge.ff
# Résultat: false
```

### 🌍 Configuration globale (optionnel)

Si tu veux cette stratégie pour tous tes projets:

```bash
git config --global merge.ff false
```

### 📝 Appliquer la configuration

Exécute cette commande dans le repo:

```bash
cd /Users/amieladjovi/Documents/Projets/Developpement/Projets/sendbox
git config merge.ff false
```

Puis commit cette configuration:

```bash
git add .git/config
git commit -m "config: set merge strategy to --no-ff for all merges"
```

---

## 💡 Alternative: Merge manuel avec --no-ff

Si tu oublies la configuration, tu peux toujours forcer le merge commit:

```bash
git merge --no-ff <branch-name>
```

Exemple:
```bash
git checkout develop
git merge --no-ff feat/test-vercel-deploy
```

---

## 🎯 Résultat attendu

### Sans --no-ff (fast-forward):
```
main    ●
        │
        ●  ← Commit de la branche intégré directement
        │
develop ●
```

### Avec --no-ff (merge commit):
```
main    ●─────┐
        │     │
        │     ●  ← Commit de la branche
        │    ╱
        ●───  ← Merge commit (visible dans main)
        │
develop ●
```

La branche est visible dans l'historique !

---

## 🚀 Pour GitHub

### Option 1: Rules (recommandée)

Si tu veux forcer cela pour TOUT LE MONDE:

1. Aller à GitHub > Settings > Branches
2. Ajouter une règle pour `develop` et `main`
3. Cocher "Require a merge commit"

### Option 2: Protection de branche

Settings > Branch protection rules:
- Base branch: `develop`
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ **Require merge commits** ← Cette option !
- ✅ Dismiss stale PR approvals

---

## 📋 Checklist

- [ ] Exécuter: `git config merge.ff false`
- [ ] Tester avec: `git merge --no-ff <branch>`
- [ ] Vérifier le graphe: `git log --graph --oneline -10`
- [ ] (Optionnel) Configurer GitHub branch rules

---

## ✅ Vérification

Après configuration, vérifie:

```bash
# Voir la configuration
git config merge.ff
# Résultat attendu: false

# Voir le graphe de merge
git log --oneline --graph -10
# Les merges doivent créer des commit visibles
```

---

## 🎓 Pourquoi c'est important

**Fast-forward merge (❌):**
- L'historique est linéaire
- On perd la trace qu'il y a eu une branche
- Difficile de voir les features

**Merge commit (✅):**
- L'historique montre les branches
- Facile de voir les features
- Plus clair pour la revue de code
- Meilleur pour `git revert` si besoin

---

## 📖 Références

- [Git Merge --no-ff](https://git-scm.com/docs/git-merge#Documentation/git-merge.txt---no-ff)
- [GitHub Merge Strategy](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
