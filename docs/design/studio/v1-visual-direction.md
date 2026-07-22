# Sendbox V1 — Direction visuelle

## Concept : confiance calme

Sendbox doit ressembler à un service utile compris rapidement, pas à une banque ni à une compagnie de transport. La direction combine une rigueur administrative légère, des interactions humaines crédibles et une structure de marketplace familière.

Le territoire visuel n'utilise ni drapeaux ni couleurs nationales comme fondation. France–Bénin apparaît dans les corridors, les exemples et quelques photographies ; le système reste identique pour Cotonou–Paris, Bruxelles–Dakar ou Montréal–Douala.

### Principes

- **La preuve avant la promesse** : identité vérifiée, contenu déclaré, photos et avis sont montrés comme des faits.
- **Une action claire par zone** : chaque carte ou état vide a une action dominante.
- **La couleur porte du sens** : le vert sert à l'action de marque et au succès, jamais à décorer tout l'écran.
- **Des surfaces calmes** : bordures fines, peu d'ombres et pas de cartes imbriquées.
- **L'humain reste inspectable** : photos lumineuses, gestes lisibles, aucun effet publicitaire dramatique.

## Palette et tokens proposés

Les valeurs hexadécimales servent de référence de design ; l'intégration pourra les convertir en OKLCH.

### Marque et surfaces

| Token                  | Valeur    | Usage                                         |
| ---------------------- | --------- | --------------------------------------------- |
| `color.canvas`         | `#F7F8F5` | Fond général, gris chaud presque blanc        |
| `color.surface`        | `#FFFFFF` | Cartes, menus, champs                         |
| `color.surface.subtle` | `#F0F3F1` | Zones secondaires et squelettes               |
| `color.ink`            | `#17201D` | Texte principal                               |
| `color.ink.muted`      | `#5E6B66` | Texte secondaire ; contraste 5,57:1 sur blanc |
| `color.border`         | `#D9E0DC` | Bordure standard                              |
| `color.border.strong`  | `#B8C4BE` | Champs actifs, séparateurs importants         |
| `color.brand`          | `#176B57` | Action primaire ; contraste 6,41:1 avec blanc |
| `color.brand.hover`    | `#125846` | Survol                                        |
| `color.brand.pressed`  | `#0E4739` | Pressé                                        |
| `color.brand.soft`     | `#E7F2EE` | Fond de sélection, jamais texte seul          |
| `color.ink-blue`       | `#2B526D` | Information et liens secondaires              |
| `color.focus`          | `#2D7F6B` | Anneau de focus 2 px + offset 2 px            |

### Couleurs sémantiques

| Rôle        | Texte / icône | Fond      | Bordure   | Exemples                   |
| ----------- | ------------- | --------- | --------- | -------------------------- |
| Neutre      | `#44514C`     | `#F0F3F1` | `#D9E0DC` | brouillon, inactif         |
| Information | `#2B526D`     | `#EAF2F7` | `#BFD3E0` | conseil, étape à venir     |
| Succès      | `#237A57`     | `#E8F4ED` | `#B9DBC8` | KYC validé, livré          |
| Attention   | `#855900`     | `#FFF5D8` | `#E7C875` | action requise, en attente |
| Danger      | `#B42318`     | `#FDECEA` | `#F2B8B5` | refus, échec, litige       |

La couleur n'est jamais le seul signal : chaque statut conserve un libellé explicite et, si utile, une icône stable.

## Typographie

- **Titres** : Space Grotesk 600–700, pour le hero et les titres de page. Pas de graisse 300 dans les zones critiques.
- **Interface et texte** : Figtree 400–600.
- **Corps minimum** : 14 px sur desktop, 15–16 px pour les textes longs, 12 px minimum pour les métadonnées.
- **Hero** : 48–64 px desktop, 36–40 px mobile, ligne à 1,05–1,12.
- **Titre de page** : 28–32 px desktop, 24–28 px mobile.
- **Titre de carte** : 16–18 px ; jamais 13 px si c'est le titre principal.
- **Capitales espacées** : réservées à de très courts sur-labels.

## Géométrie et rythme

| Token            |                            Valeur | Usage                          |
| ---------------- | --------------------------------: | ------------------------------ |
| `radius.control` |                              6 px | Boutons, champs, petits badges |
| `radius.card`    |                              8 px | Cartes standard                |
| `radius.feature` |                             12 px | Bloc marketing isolé           |
| `radius.pill`    |                            999 px | Statut compact seulement       |
| `space.unit`     |                              4 px | Base                           |
| `space.card`     |                          20–24 px | Padding carte                  |
| `shadow.overlay` | `0 12px 32px rgb(23 32 29 / 12%)` | Menus et dialogues uniquement  |

Les cartes n'ont pas d'ombre par défaut. Au survol, privilégier une bordure plus forte et un changement de fond discret plutôt qu'un déplacement vertical.

## Règles de composants

### Boutons

| Variante   | Traitement                               | Usage                              |
| ---------- | ---------------------------------------- | ---------------------------------- |
| Primaire   | fond `brand`, texte blanc, hauteur 44 px | Action principale d'un écran       |
| Secondaire | fond blanc, bordure forte, texte `ink`   | Alternative importante             |
| Tertiaire  | sans fond, texte `brand` ou `ink`        | Action locale ou navigation        |
| Destructif | fond danger dans une confirmation        | Suppression ou action irréversible |

- Un seul bouton primaire par groupe visuel.
- Les icônes sont optionnelles et placées de manière cohérente ; ne pas utiliser une flèche partout.
- Hover, pressed, focus, disabled et loading gardent la largeur du bouton.
- Hauteur tactile minimale : 44 px.

### Alertes

- Structure : icône, titre concret, explication courte, action suivante.
- Information ne ressemble pas à une erreur ; attention signifie qu'une action utilisateur est attendue.
- Les alertes KYC utilisent les mêmes rôles sémantiques que le reste du produit.
- Éviter les délais garantis. Préférer « Nous vous notifierons après examen » à « sous 24–48 h » si ce délai n'est pas contractuel.

### Badges

Trois familles, non interchangeables :

1. **Identité** : « Identité vérifiée » avec icône, vert doux.
2. **Statut de parcours** : en attente, accepté, remis, en transit, livré, litige ; couleurs sémantiques.
3. **Métadonnée** : date, capacité, corridor ; traitement neutre.

Hauteur 24–28 px, rayon 6 px ou pill pour un statut court, texte 12–13 px. Un badge n'est pas un conteneur multi-lignes.

### Cartes

- Une carte regroupe un objet : annonce, demande, profil ou colis.
- Ordre d'une annonce : corridor → dates → capacité → profil et preuves → action.
- Le prix de transport, s'il est affiché, porte la mention « convenu et payé hors Sendbox » dans le détail.
- Une surface, bordure 1 px, rayon 8 px, pas d'ombre par défaut.
- Le footer teinté n'est utilisé que s'il signale une zone interactive claire.
- Éviter les badges multi-lignes qui deviennent des mini-cartes.

### Empty states

Structure constante : image de 144–200 px, titre factuel, explication de deux lignes maximum, un CTA principal et un lien secondaire facultatif.

| État                | Titre                 | Description                                                            | CTA                  |
| ------------------- | --------------------- | ---------------------------------------------------------------------- | -------------------- |
| Aucun colis         | Aucun colis en cours  | Vos demandes acceptées apparaîtront ici avec leurs preuves et statuts. | Trouver un trajet    |
| Aucun trajet        | Aucun trajet publié   | Publiez vos dates et votre capacité pour recevoir des demandes.        | Publier un trajet    |
| Aucune demande      | Aucune demande reçue  | Les demandes compatibles avec vos trajets apparaîtront ici.            | Voir mes trajets     |
| Aucune conversation | Aucune conversation   | Une conversation s'ouvre lorsqu'une demande est engagée.               | Explorer les trajets |
| KYC en attente      | Vérification en cours | Vos documents ont été reçus. Nous vous notifierons après examen.       | Voir le statut       |

L'état vide n'utilise ni rouge ni langage d'erreur. Sur mobile, l'image descend à 120–144 px pour garder le CTA visible.

## Direction photographique

- Lumière naturelle de jour, neutre à légèrement chaude.
- Personnes adultes, diversité réaliste des diasporas et voyageurs internationaux.
- Gestes fonctionnels : remettre, inspecter, photographier, confirmer.
- Vêtements naturels et soignés ; aucun uniforme de transporteur.
- Lieux publics crédibles, propres mais non luxueux.
- Aucun drapeau dominant, monument cliché ou code couleur national.
- Aucun texte lisible sur téléphone ou document.
- Contraste et cadrage testés en 16:9 desktop et 4:5 mobile.

## Assets prioritaires

| Priorité | Asset                | Rôle                     | Critère principal              |
| -------- | -------------------- | ------------------------ | ------------------------------ |
| P0       | Hero remise colis    | Compréhension du service | geste lisible + espace texte   |
| P0       | Empty aucun colis    | Activation expéditeur    | CTA visible sans dramatisation |
| P0       | Empty aucun trajet   | Activation voyageur      | valise et colis, sans marque   |
| P0       | Empty aucune demande | Attente non anxiogène    | cohérence de famille           |
| P0       | KYC en attente       | Confiance administrative | pas de données personnelles    |
| P1       | Déclaration colis    | Transparence             | objets ordinaires inspectables |
| P1       | Preuve photo remise  | Traçabilité              | geste photo explicite          |
| P1       | Livraison confirmée  | Fin de parcours          | confirmation sans garantie     |
| P1       | Avis et réputation   | Confiance sociale        | pas d'UI copiée                |
| P2       | Litige / signalement | Aide                     | ton factuel, non dramatique    |

## Priorités de livraison — 3 lots

### Lot 1 — Vérité produit et fondations

- Corriger les formulations incompatibles avec la V1.
- Installer les tokens de couleur, rayons, focus et statuts.
- Normaliser boutons, alertes, badges et cartes.
- Sélectionner le hero et trois empty states P0.

### Lot 2 — Parcours clés

- Recomposer landing, cartes annonces, dashboard et détail colis.
- Ajouter les assets KYC, déclaration et preuves photo.
- Tester les crops mobile et les états sans données.

### Lot 3 — Confiance et finition

- Harmoniser avis, signalement, litige, notifications et messagerie.
- Vérifier contraste, clavier, lecteur d'écran et mouvement réduit.
- Tester la compréhension : 2,90 EUR Sendbox versus transport hors plateforme.

## Garde-fous de marque

Toujours dire : « mise en relation », « profil vérifié », « contenu déclaré », « preuves photo », « transport payé hors plateforme ».  
Ne jamais suggérer : « transport garanti », « colis assuré », « fonds protégés », « voyageur payé par Sendbox » ou « remboursement automatique ».
