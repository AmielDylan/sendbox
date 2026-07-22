# Sendbox V1 - Brief créatif pour production visuelle

## Mission

Créer une direction visuelle V1 pour Sendbox : une plateforme de mise en relation sécurisée entre expéditeurs et voyageurs vérifiés.

L'objectif n'est pas de faire une refonte lourde. L'objectif est de donner à l'interface une présence plus professionnelle, plus cohérente et plus rassurante, tout en gardant une V1 simple à livrer.

## Contexte produit

Sendbox aide une personne à confier un colis à un voyageur qui effectue déjà un trajet.

La V1 repose sur :

- un profil vérifié ;
- une annonce de trajet ;
- une demande de colis ;
- une déclaration claire du contenu ;
- l'acceptation ou le refus par le voyageur ;
- des frais Sendbox de mise en relation de 2,90 EUR ;
- un transport payé directement entre particuliers, hors plateforme ;
- des preuves photo de remise et livraison ;
- des avis et commentaires après livraison ;
- des signalements et litiges.

Sendbox ne doit pas être présenté comme transporteur, assureur ou tiers de confiance financier complet.

## Ambition

Faire ressentir :

- confiance ;
- clarté ;
- proximité humaine ;
- rigueur ;
- sérieux administratif léger ;
- simplicité d'usage.

Éviter :

- les visuels trop corporate ou banque ;
- les illustrations SaaS génériques ;
- les fonds violets/bleus startup trop vus ;
- les arrondis trop mous ;
- les cartes imbriquées ;
- les alertes colorées sans logique ;
- les images trop stock, trop floues ou trop dramatiques.

## Références d'expérience

Selon la Jakob's Law, les utilisateurs doivent retrouver les conventions qu'ils connaissent déjà :

- recherche avec départ, arrivée, date ;
- cartes d'annonce lisibles ;
- badges de vérification ;
- profil avec avatar, nom, note, avis ;
- timeline de statut colis ;
- messagerie simple ;
- centre d'aide en FAQ ;
- dashboard avec actions claires ;
- états vides actionnables.

Inspiration possible :

- plateformes de confiance entre particuliers ;
- immobilier ou marketplace premium accessible ;
- applications de voyage ;
- sites de services utiles, sobres et bien tenus.

Ne pas copier une marque existante. Reprendre des codes attendus, pas une identité.

## Direction visuelle souhaitée

Le rendu doit être épuré mais pas vide.

Préférer :

- angles modérés, plutôt 6 à 8 px ;
- contrastes nets ;
- typographie moins ronde dans les zones opérationnelles ;
- couleurs système cohérentes ;
- bordures fines et utiles ;
- surfaces calmes ;
- espacements réguliers ;
- photos réalistes, lumineuses et inspectables ;
- touches graphiques issues du logo globe quand le SVG définitif sera disponible.

Palette à explorer :

- base claire : blanc cassé très discret ou gris chaud très léger ;
- texte principal : noir ou graphite ;
- accent : vert confiance maîtrisé, pas fluorescent ;
- secondaires : bleu encre ou jaune doux uniquement comme accents ;
- danger/warning/success : cohérents, lisibles et sobres.

Éviter une palette monotone beige, brun, violet ou bleu nuit.

## Écrans prioritaires

1. Landing publique
   - hero ;
   - section confiance ;
   - section fonctionnement ;
   - section tarif ;
   - FAQ ;
   - footer.

2. Empty states
   - aucun colis ;
   - aucun trajet ;
   - aucune demande reçue ;
   - aucune notification ;
   - aucune conversation ;
   - aucun avis ;
   - KYC en attente.

3. Parcours confiance
   - profil public ;
   - carte annonce ;
   - carte demande voyageur ;
   - détail colis ;
   - preuves photo ;
   - avis après livraison ;
   - litige/signalement.

## Format attendu du studio

Produire :

- une proposition de direction visuelle ;
- une palette avec tokens proposés ;
- une critique de l'UI actuelle ;
- une liste d'assets à générer ;
- des prompts image prêts à lancer ;
- des recommandations UI concrètes et priorisées ;
- des risques à éviter avant la V1.

Ne pas modifier le code applicatif.

## Prompt one-shot recommandé

Tu es directeur artistique produit et designer UI senior. Tu travailles sur Sendbox, une plateforme V1 de mise en relation sécurisée entre expéditeurs et voyageurs vérifiés pour confier des colis à des voyageurs.

Lis les fichiers du dossier `docs/design/studio/`. Propose une direction visuelle V1 professionnelle, sobre et humaine. Tu dois respecter le modèle V1 réel : Sendbox encaisse uniquement 2,90 EUR de frais de mise en relation, le transport est payé hors plateforme, il n'y a pas d'assurance vendue, pas d'escrow, pas de reversement voyageur.

Ta réponse doit contenir :

1. diagnostic de l'UI actuelle ;
2. direction artistique ;
3. palette/tokens proposés ;
4. règles de composants : boutons, alertes, badges, cartes, empty states ;
5. liste des assets nécessaires ;
6. prompts d'images détaillés ;
7. priorités V1 en 3 lots maximum.

Écris tes propositions dans `docs/design/studio/` et place les images candidates dans `public/images/studio/v1/`. Ne modifie pas `app/`, `components/`, `lib/`, `hooks/` ou `styles/`.
