# Sendbox V1 - Manifeste assets

Les fichiers générés par le studio doivent être placés dans `public/images/studio/v1/`.

## Nommage

Utiliser des noms lisibles :

- `hero-handoff-airport-01.png`
- `trust-kyc-review-01.png`
- `trust-package-declaration-01.png`
- `proof-handoff-photo-01.png`
- `proof-delivery-confirmed-01.png`
- `empty-packages-01.png`
- `empty-trips-01.png`
- `empty-messages-01.png`
- `empty-notifications-01.png`
- `empty-kyc-pending-01.png`

## Assets prioritaires V1

| Priorité | Asset | Usage | Format cible |
| --- | --- | --- | --- |
| P0 | Hero remise colis | Landing | 16:9 ou 21:9 |
| P0 | Empty aucun colis | Dashboard colis | 4:3 ou 1:1 |
| P0 | Empty aucun trajet | Dashboard annonces | 4:3 ou 1:1 |
| P0 | Empty aucune demande | Messages demandes | 4:3 ou 1:1 |
| P0 | KYC en attente | Réglages KYC | 4:3 |
| P1 | Déclaration colis | Section confiance | 3:2 |
| P1 | Preuve photo remise | Section fonctionnement | 3:2 |
| P1 | Livraison confirmée | Section fonctionnement | 3:2 |
| P1 | Avis réputation | Profil public | 3:2 |
| P2 | Litige/signalement | Aide/admin | 3:2 |

## Critères d'acceptation

Un asset est candidat à l'intégration si :

- il est compréhensible en moins de 2 secondes ;
- il ne promet pas une fonctionnalité absente de la V1 ;
- il reste lisible en desktop et mobile ;
- il ne contient pas de texte incrusté ;
- il ne contient pas de données personnelles ;
- il ne ressemble pas à une banque, une assurance ou une compagnie de transport ;
- il peut vivre dans une UI sobre.

## Métadonnées à renseigner par le studio

Pour chaque image candidate, ajouter une ligne :

| Fichier | Prompt source | Usage recommandé | Points forts | Risques / limites | Statut |
| --- | --- | --- | --- | --- | --- |
| `hero-handoff-airport-01.png` | Voir `v1-image-prompts.md` | Hero landing | À compléter | À compléter | candidate |

Statuts possibles :

- `candidate`
- `selected`
- `rejected`
- `needs-edit`
