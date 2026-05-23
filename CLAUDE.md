# CLAUDE.md - Instructions Claude Code pour Sendbox

## Workflow Git obligatoire

**Règle absolue : aucune exception, même pour un fix d'une ligne.**

### Avant toute modification de code

1. Vérifier la branche active : `git branch --show-current`
2. Si la branche active est `develop` (ou `main`), créer une branche dédiée immédiatement :
   - `git checkout -b feat/<nom>` pour une fonctionnalité
   - `git checkout -b fix/<nom>` pour un correctif
   - `git checkout -b chore/<nom>` pour une tâche technique
3. Ne commiter **qu'** sur la branche dédiée

### Après les modifications

4. Merger dans `develop` avec no-fast-forward : `git merge --no-ff <branche>`
5. Supprimer la branche locale : `git branch -d <branche>`
6. Supprimer la branche distante si elle a été poussée : `git push origin --delete <branche>`
7. Revenir sur `develop` immédiatement

### Pour pousser vers main

8. Créer une PR `develop -> main` via `gh pr create --base main --head develop`
9. Merger via `gh pr merge --merge` (jamais `git push origin main` directement)
10. Revenir sur `develop` : `git checkout develop`

### Interdit

- `git commit` directement sur `develop` ou `main`
- `git push origin main` directement
- `git merge` sans `--no-ff`
- Laisser une branche de travail après merge

## Conventions de nommage

- Branches : `feat/`, `fix/`, `chore/` + nom en kebab-case francais ou anglais
- Commits : préfixe conventionnel (`feat:`, `fix:`, `chore:`, `refactor:`, etc.)

## Règles d'écriture (UI, textes, code)

- **Interdiction absolue du caractère "—" (em-dash)** dans tout texte : UI, labels, placeholders, emails, notifications, alt text.
  - Remplacer par `:` (séparation), `,` (incise) ou `-` (trait d'union) selon le contexte.
  - Vérification avant commit : `grep -rn " — \| —$\|—" app/ components/`

## Stack technique

- Next.js (App Router), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui (Radix UI), Tabler Icons
- Supabase (auth + DB + storage), Stripe, Resend
- Tests : Vitest + Playwright

## Contraintes paiement

- Stripe disponible pour la France
- FedaPay pour le Bénin (en cours d'intégration)
