# Sendbox V1 — Audit UI actuel

Date de revue : 22 juillet 2026  
Périmètre : landing, recherche, annonces, dashboard, colis, messagerie, notifications, KYC et composants UI partagés.  
Méthode : revue des sources et inspection de l'asset hero actuel. Aucun code applicatif n'a été modifié.

## Synthèse

L'interface a une base exploitable : conventions familières, composants partagés, hiérarchie globalement lisible, hero photographique crédible et prix de 2,90 EUR correctement exposé. Le principal risque V1 n'est pas esthétique mais sémantique : plusieurs libellés et widgets racontent encore un produit de paiement ou de transport qui n'est pas la V1.

La couche visuelle manque ensuite d'une grammaire unique. Le teal clair actuel paraît parfois décoratif, les statuts utilisent des couleurs directes différentes, les rayons vont de 4 px à 32 px et certaines cartes cumulent bordure, fond teinté, badge et ombre. L'ensemble reste fonctionnel, mais la confiance est affaiblie par ces variations.

## Score rapide

| Zone                       | Lisibilité | Confiance | Hiérarchie | Cohérence | Mobile | Promesse V1 | Global |
| -------------------------- | ---------: | --------: | ---------: | --------: | -----: | ----------: | -----: |
| Landing                    |          4 |         3 |          4 |         3 |      3 |           2 |  3,2/5 |
| Recherche + annonces       |          3 |         2 |          3 |         2 |      3 |           2 |  2,5/5 |
| Dashboard                  |          3 |         1 |          3 |         2 |      2 |           1 |  2,0/5 |
| Colis + timeline           |          3 |         2 |          3 |         2 |      3 |           1 |  2,3/5 |
| Messagerie + notifications |          3 |         3 |          3 |         3 |      3 |           3 |  3,0/5 |
| KYC + alertes              |          3 |         3 |          3 |         2 |      3 |           3 |  2,8/5 |

## Ce qui fonctionne déjà

- Le hero actuel montre bien la remise, le voyageur et la valise, avec un espace négatif exploitable à gauche.
- Le double CTA « Envoyer un colis » / « Publier un trajet » est concret et familier.
- La section tarif affiche 2,90 EUR et précise que le transport est réglé hors plateforme.
- Les profils, avatars, notes, badges, itinéraires et dates utilisent des patterns connus.
- Les états vides ont déjà un titre, une description et souvent une prochaine action.
- La paire Figtree + Space Grotesk est lisible et suffisamment neutre pour plusieurs pays.
- Le focus visible, le mode sombre et la réduction des animations ont déjà des fondations techniques.

## Risques de confusion produit à corriger avant lancement

| Risque               | Indice actuel                                         | Pourquoi c'est bloquant                                           | Formulation V1 recommandée                                       |
| -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Transport garanti    | « Délai moyen garanti »                               | Promet un niveau de service que Sendbox ne contrôle pas.          | « Preuves de remise et de livraison »                            |
| Prix imposé          | « Tarif fixe, aucune négociation »                    | Contredit le paiement hors plateforme convenu entre particuliers. | « 2,90 EUR de frais Sendbox »                                    |
| Sendbox transporteur | « Transport vérifié » / « Suivi inclus »              | Confond vérification du profil et exécution du transport.         | « Profil vérifié » / « Preuves photo disponibles »               |
| Reversement voyageur | « Revenus », « montant net destiné au voyageur »      | Suggère que Sendbox encaisse puis reverse le transport.           | Retirer le widget financier ; montrer l'activité et les statuts. |
| Escrow               | « Fonds bloqués »                                     | Suggère une conservation de fonds par la plateforme.              | « Frais Sendbox payés », uniquement si utile.                    |
| Commission           | « Commission Sendbox (12 %) »                         | Contredit le frais fixe de mise en relation.                      | « Frais de mise en relation : 2,90 EUR »                         |
| Assurance implicite  | champs et options `insurance_premium` encore présents | Même niée dans le texte, l'option suggère un produit assurantiel. | Ne pas exposer cette option en V1.                               |
| Confiance absolue    | « 100 % voyageurs vérifiés » sans contexte            | Peut être lu comme une garantie d'exécution.                      | « Identité requise avant publication »                           |

## Diagnostic visuel

### Couleur

Le teal clair `#33C2C2` est identifiable mais manque de densité sur blanc et tire l'interface vers une esthétique SaaS. Les statuts sont définis à plusieurs endroits avec des verts, bleus, jaunes et ambres différents. Une couleur ne garde donc pas toujours la même signification.

### Typographie

La paire Figtree / Space Grotesk est pertinente. La taille racine à 87,5 %, des micro-labels à 10 px et de nombreux textes en capitales espacées diminuent la lisibilité opérationnelle. Les titres de cartes passent aussi de 13 px à 24 px sans règle stable.

### Formes et surfaces

Le composant Card de base est sobre, mais des usages locaux ajoutent `rounded-xl`, `rounded-2xl`, `rounded-[2rem]`, ombres fortes et fonds teintés. Certaines pages donnent l'impression de cartes dans des cartes.

### Landing

Le hero photographique actuel est le meilleur élément visuel : humain, clair et directement lié au service. Il sert de benchmark. L'overlay sombre et le header clair semi-transparent se concurrencent toutefois. La section tarif à 32 px de rayon est déconnectée du reste. Le bloc de statistiques de confiance comporte des promesses incompatibles avec la V1.

### Dashboard

Le dashboard montre trop tôt des graphiques et indicateurs financiers, y compris quand les données sont nulles. Pour une jeune V1, les actions suivantes et les statuts de confiance sont plus utiles que des bar charts vides. Les libellés « Revenus » et « Fonds bloqués » sont à retirer du vocabulaire V1.

### Cartes annonces

L'information essentielle est présente, mais la carte contient jusqu'à quatre langages de badge, une barre latérale, un footer teinté et plusieurs tailles de texte. Le prix par kg doit être présenté comme une indication convenue hors plateforme, jamais comme un tarif Sendbox.

### Empty states

La structure est bonne, mais l'icône ronde générique rend les états interchangeables. Une petite famille de natures mortes cohérentes donnera plus d'humanité. Un seul CTA primaire suffit.

## Les 10 corrections les plus rentables

1. Supprimer ou reformuler toutes les promesses de garantie, escrow, reversement, commission et transport vérifié.
2. Remplacer les widgets financiers du dashboard par « actions à faire », « demandes reçues » et « colis en cours ».
3. Unifier les tokens de statut : information, succès, attention, danger et neutre.
4. Assombrir l'accent principal pour garantir un contraste robuste avec du texte blanc.
5. Limiter les rayons à 6 px, 8 px et 12 px ; réserver 999 px aux pastilles.
6. Normaliser les cartes sur une bordure 1 px, sans ombre par défaut ni cartes imbriquées.
7. Réduire les micro-labels en capitales et ne jamais descendre sous 12 px dans les zones opérationnelles.
8. Recomposer les cartes annonces autour de quatre niveaux : corridor, date, capacité, profil.
9. Déployer les cinq empty states P0 avec un CTA concret et une image cohérente.
10. Rendre la phrase « 2,90 EUR de frais Sendbox ; transport payé hors plateforme » visible avant toute confirmation.

## Trois corrections à ne pas faire maintenant

1. Ne pas lancer une refonte complète du logo ou un langage illustratif complexe.
2. Ne pas construire un dashboard analytique avancé : le volume V1 ne le justifie pas.
3. Ne pas produire une variante visuelle par pays : les corridors sont des données, pas des thèmes.

## Critères de sortie V1

- Aucun écran n'implique assurance, escrow, garantie de transport ou reversement voyageur.
- Le frais Sendbox de 2,90 EUR est distinct du prix du transport.
- Un statut garde le même mot, la même couleur et la même icône partout.
- Chaque état vide explique la situation et propose une seule action suivante.
- Les actions tactiles font au moins 44 px de haut sur mobile.
- La hiérarchie reste compréhensible sans couleur seule.
