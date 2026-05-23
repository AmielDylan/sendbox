# Instructions de workflow Git obligatoires

## Règle générale

Ce dépôt suit un workflow Git strict pour chaque développement.

## Branche develop

- **Ne jamais coder directement sur `develop`**.
- Toujours créer une **branche dédiée** pour le développement.
- À la fin du développement, **fusionner cette branche vers `develop` en mode `--no-ff`**.
- **Supprimer la branche de développement après fusion**.
- Après la fusion, **revenir sur `develop`**.

## Branche main

- Le travail validé sur `develop` doit être **fusionné vers `main` via une Pull Request**.
- La PR doit être **auto-merge**.
- Après la fusion réussie sur `main`, **revenir sur `develop`**.

## Checklist obligatoire avant toute modification

1. Vérifier la branche active.
2. Si la branche active est `develop`, **créer une nouvelle branche** avant toute modification.
3. Travailler uniquement sur la branche dédiée.
4. À la fin, fusionner vers `develop` avec `--no-ff`.
5. Supprimer la branche dédiée.
6. Ouvrir une PR `develop -> main` avec auto-merge.
7. Revenir sur `develop` après validation de la fusion sur `main`.

## Règle d’exception

Aucune exception ne doit être faite à cette règle, sauf si l’équipe décide explicitement le contraire par décision écrite.
