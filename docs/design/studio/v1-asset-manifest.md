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
- `empty-requests-01.png`
- `empty-messages-01.png`
- `empty-notifications-01.png`
- `empty-kyc-pending-01.png`
- `trust-reputation-01.png`
- `trust-dispute-report-01.png`

## Assets prioritaires V1

| Priorité | Asset                | Usage                  | Format cible |
| -------- | -------------------- | ---------------------- | ------------ |
| P0       | Hero remise colis    | Landing                | 16:9 ou 21:9 |
| P0       | Empty aucun colis    | Dashboard colis        | 4:3 ou 1:1   |
| P0       | Empty aucun trajet   | Dashboard annonces     | 4:3 ou 1:1   |
| P0       | Empty aucune demande | Messages demandes      | 4:3 ou 1:1   |
| P0       | KYC en attente       | Réglages KYC           | 4:3          |
| P1       | Déclaration colis    | Section confiance      | 3:2          |
| P1       | Preuve photo remise  | Section fonctionnement | 3:2          |
| P1       | Livraison confirmée  | Section fonctionnement | 3:2          |
| P1       | Avis réputation      | Profil public          | 3:2          |
| P2       | Litige/signalement   | Aide/admin             | 3:2          |

## Critères d'acceptation

Un asset est candidat à l'intégration si :

- il est compréhensible en moins de 2 secondes ;
- il ne promet pas une fonctionnalité absente de la V1 ;
- il reste lisible en desktop et mobile ;
- il ne contient pas de texte incrusté ;
- il ne contient pas de données personnelles ;
- il ne ressemble pas à une banque, une assurance ou une compagnie de transport ;
- il peut vivre dans une UI sobre.

## Candidats produits — 22 juillet 2026

| Fichier                       | Prompt source                           | Usage recommandé               | Points forts                                                                                                                    | Risques / limites                                                                                                     | Statut    |
| ----------------------------- | --------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------- |
| `hero-handoff-airport-01.png` | Hero P0, variante de production         | Test A/B hero landing          | Remise immédiatement lisible, deux adultes crédibles, mains propres, grand espace à gauche, aucun signe de paiement ou garantie | Valise cabine non visible ; vérifier le crop 4:5 et comparer à `hero-trust-handoff-v2.png`                            | candidate |
| `empty-packages-01.png`       | Empty colis P0, variante de production  | Dashboard colis, 144–200 px    | Silhouette simple, colis fermé, smartphone neutre, excellent détourage visuel sur surface claire                                | Rendu carré ; tester sur fond `canvas` pour éviter un cadre visible                                                   | candidate |
| `empty-trips-01.png`          | Empty trajet P0, variante de production | Dashboard annonces, 144–200 px | Groupe valise + colis compris rapidement, texture sobre, aucun pays imposé                                                      | Valise présentée à plat ; le document abstrait doit rester petit pour ne pas être lu comme une vraie pièce d'identité | candidate |

### Recommandation de sélection

- Utiliser les deux empty states dans une maquette de composant avant sélection finale.
- Conserver le hero actuel `public/images/landing/hero-trust-handoff-v2.png` comme hero V1 : il paraît plus humain et vivant, et explicite mieux la notion de voyage. La priorité d'intégration est de corriger son crop mobile, notamment la tête du voyageur coupée en haut.
- Garder `hero-handoff-airport-01.png` comme candidat secondaire : il offre une diversité plus multi-pays et une remise plus proche, mais il ne remplace pas le hero actuel sans test de contexte.
- Ne passer un asset en `selected` qu'après validation du crop desktop, 4:5 mobile et du contraste du texte superposé.

## Métadonnées à renseigner pour les prochains assets

| Fichier           | Prompt source                    | Usage recommandé | Points forts | Risques / limites | Statut    |
| ----------------- | -------------------------------- | ---------------- | ------------ | ----------------- | --------- |
| `nom-fichier.png` | Section de `v1-image-prompts.md` | À préciser       | À compléter  | À compléter       | candidate |

Statuts possibles :

- `candidate`
- `selected`
- `rejected`
- `needs-edit`
