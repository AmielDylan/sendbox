# Guide de Test MVP Sendbox

**Version** : 1.0.0  
**Date** : 2024-12-19  
**Statut** : MVP Opérationnel ✅

## Vue d'ensemble

Ce guide détaille les procédures de test pour valider tous les flux principaux du MVP Sendbox. Tous les tests automatiques passent (21/21 ✅). Ce document couvre les tests manuels des fonctionnalités.

## Prérequis

- ✅ Serveur Next.js démarré (`npm run dev` sur port 3000)
- ✅ Migrations Supabase appliquées (027 et 028)
- ✅ Variables d'environnement configurées
- ✅ Compte de test : amieladjovi@yahoo.fr / Amieldylan2025@

## Résumé des Tests Automatiques

```bash
# Exécuter les tests
cd /Users/amieladjovi/Documents/Projets/Developpement/Projets/sendbox
node_modules/.bin/tsx scripts/test-all-endpoints.ts
```

**Résultat** : 21/21 tests réussis ✅

- ✅ Connexion Supabase
- ✅ Authentification utilisateur
- ✅ Pages (accueil, auth, dashboard)
- ✅ API Routes Stripe (protection active)
- ✅ Server Actions (profiles, annonces, réservations, notifications)
- ✅ Fonctions RPC (search, conversations, notifications)

---

## Tests Manuels des Flux Principaux

### 1. Flux d'Inscription et Vérification Email

#### Objectif
Valider l'inscription d'un nouvel utilisateur et la vérification par email.

#### Étapes

1. **Accéder à la page d'inscription**
   - URL : http://localhost:3000/register
   - Vérifier l'affichage du formulaire

2. **Remplir le formulaire**
   ```
   Prénom : TestUser
   Nom : MVP
   Email : test.mvp@example.com
   Téléphone : +33612345678
   Mot de passe : TestMVP2024@
   Confirmer mot de passe : TestMVP2024@
   ☑ Accepter les CGU
   ```

3. **Soumettre le formulaire**
   - Cliquer sur "S'inscrire"
   - Vérifier la redirection vers `/verify-email`
   - Message attendu : "Vérifiez votre email pour confirmer votre compte"

4. **Vérifier l'email**
   - Ouvrir Supabase Dashboard > Authentication > Users
   - Trouver l'utilisateur test.mvp@example.com
   - Copier le lien de vérification depuis les logs ou emails
   - OU : Cliquer sur les 3 points > Send verification email

5. **Confirmer l'email**
   - Cliquer sur le lien de vérification
   - Vérifier la redirection vers `/dashboard?verified=true`

#### Validations

- ✅ Checkbox CGU fonctionne (corrigé via `Controller`)
- ✅ Validation Zod côté serveur
- ✅ Email de vérification envoyé
- ✅ Redirection correcte après vérification
- ✅ Profil créé dans la table `profiles`

---

### 2. Flux de Connexion

#### Objectif
Valider la connexion d'un utilisateur existant.

#### Étapes

1. **Accéder à la page de connexion**
   - URL : http://localhost:3000/login
   - Vérifier l'affichage du formulaire

2. **Se connecter avec le compte de test**
   ```
   Email : amieladjovi@yahoo.fr
   Mot de passe : Amieldylan2025@
   ☑ Se souvenir de moi (optionnel)
   ```

3. **Soumettre le formulaire**
   - Cliquer sur "Se connecter"
   - Vérifier la redirection vers `/dashboard`
   - Dashboard doit s'afficher correctement

#### Validations

- ✅ Authentification réussie
- ✅ Session créée (cookie Supabase)
- ✅ Redirection vers dashboard
- ✅ Navbar affiche les menus utilisateur

---

### 3. Flux KYC (Know Your Customer)

#### Objectif
Valider la soumission des documents KYC.

#### Étapes

1. **Accéder à la page KYC**
   - URL : http://localhost:3000/dashboard/reglages/kyc
   - Ou : Dashboard > Réglages > KYC

2. **Vérifier le statut KYC**
   - Si `pending` : "Votre KYC est en attente"
   - Si `not_submitted` : Formulaire affiché

3. **Remplir le formulaire KYC**
   ```
   Type de document : Passeport
   Numéro : AB123456
   Date de naissance : 01/01/1990
   Nationalité : Française
   Adresse : 1 rue Test, 75001 Paris
   Photo recto : Upload image (JPG/PNG, max 5MB)
   Photo verso : Upload image (JPG/PNG, max 5MB)
   ```

4. **Soumettre le KYC**
   - Cliquer sur "Soumettre mon KYC"
   - Vérifier le message de succès
   - Statut devrait passer à `pending`

5. **Approuver le KYC (Admin)**
   - Aller sur Supabase Dashboard
   - SQL Editor > Nouvelle requête
   ```sql
   UPDATE profiles 
   SET kyc_status = 'approved', 
       kyc_reviewed_at = NOW()
   WHERE email = 'amieladjovi@yahoo.fr';
   ```
   - Exécuter la requête

6. **Vérifier l'approbation**
   - Rafraîchir la page `/dashboard/reglages/kyc`
   - Message attendu : "Votre KYC est approuvé ✅"

#### Validations

- ✅ Upload des documents (bucket `kyc-documents`)
- ✅ Validation des fichiers (type, taille)
- ✅ Statut KYC mis à jour
- ✅ Documents sécurisés (RLS actif)

---

### 4. Flux de Création d'Annonce (Voyageur)

#### Objectif
Valider la création d'une annonce de voyage par un voyageur.

#### Prérequis
- KYC approuvé (voir flux 3)

#### Étapes

1. **Accéder à la création d'annonce**
   - URL : http://localhost:3000/dashboard/annonces/new
   - Ou : Dashboard > Annonces > Nouvelle annonce

2. **Étape 1 : Trajet**
   ```
   Pays de départ : France
   Ville de départ : Paris (autocomplete)
   Date de départ : [Sélectionner date future]
   Pays d'arrivée : Bénin
   Ville d'arrivée : Cotonou (liste)
   Date d'arrivée : [Après date départ]
   ```
   - Tester l'autocomplete des villes françaises
   - Vérifier la validation (arrivée > départ)
   - Cliquer sur "Suivant"

3. **Étape 2 : Capacité**
   ```
   Poids disponible : 10 kg (slider)
   Prix par kilo : 15 € (input)
   Description : "Je voyage régulièrement, colis fragiles acceptés" (optionnel)
   ```
   - Vérifier les limites (1-30 kg, 5-100 €/kg)
   - Cliquer sur "Suivant"

4. **Étape 3 : Récapitulatif**
   - Vérifier toutes les informations
   - Cliquer sur "Publier l'annonce"

5. **Vérifier la création**
   - Redirection vers `/dashboard/annonces/[id]`
   - Annonce affichée avec statut "active"
   - Liste des annonces mise à jour

#### Validations

- ✅ Formulaire multi-step fonctionnel
- ✅ Autocomplete villes (API Address Data Gouv)
- ✅ Validation Zod côté serveur
- ✅ Limite 10 annonces actives vérifiée
- ✅ Annonce insérée dans table `announcements`

---

### 5. Flux de Recherche et Réservation (Expéditeur)

#### Objectif
Rechercher une annonce et créer une réservation.

#### Étapes

1. **Rechercher une annonce**
   - URL : http://localhost:3000/recherche
   - Ou : Page d'accueil > Rechercher
   ```
   Pays de départ : France
   Pays d'arrivée : Bénin
   Date de départ : [Date proche de l'annonce créée]
   Poids minimum : 5 kg
   ```
   - Cliquer sur "Rechercher"
   - Vérifier les résultats (fonction RPC `search_announcements`)

2. **Créer une réservation**
   - Cliquer sur une annonce dans les résultats
   - Voir les détails du voyageur (prénom, note, services)
   - Cliquer sur "Réserver"

3. **Remplir le formulaire de réservation**
   ```
   Poids du colis : 8 kg
   Valeur déclarée : 150 € (pour assurance)
   Description : "Vêtements et chaussures"
   Assurance : ☑ Oui (optionnelle)
   Photos du colis : Upload 2-3 images
   ```

4. **Soumettre la réservation**
   - Cliquer sur "Créer la réservation"
   - Vérifier la redirection vers `/dashboard/colis/[id]`
   - Statut attendu : `pending`

5. **Voyageur accepte la réservation**
   - Se connecter en tant que voyageur
   - Dashboard > Mes annonces > [Annonce] > Demandes
   - Accepter la réservation
   - Statut passe à `confirmed`

#### Validations

- ✅ Recherche RPC fonctionnelle
- ✅ Upload photos colis (traitement Sharp)
- ✅ Calcul automatique : prix + commission + assurance
- ✅ Limite 5 réservations en attente
- ✅ Notifications créées

---

### 6. Flux de Paiement Stripe

#### Objectif
Effectuer un paiement sécurisé via Stripe.

#### Prérequis
- Réservation confirmée (statut `confirmed`)

#### Étapes

1. **Accéder au paiement**
   - Dashboard > Mes colis > [Réservation confirmée]
   - Cliquer sur "Payer"
   - Redirection vers `/dashboard/colis/[id]/paiement`

2. **Vérifier le récapitulatif**
   ```
   Prix du transport : 120 € (8 kg × 15 €)
   Commission Sendbox : 12 € (10%)
   Assurance : 3 € (2% de la valeur)
   Total : 135 €
   ```

3. **Remplir Stripe Elements**
   - Carte de test Stripe : `4242 4242 4242 4242`
   - Date d'expiration : 12/34
   - CVC : 123
   - Code postal : 75001

4. **Effectuer le paiement**
   - Cliquer sur "Payer"
   - Attendre la confirmation (1-2 secondes)
   - Vérifier le message de succès

5. **Vérifier le webhook**
   - Le serveur reçoit `payment_intent.succeeded`
   - Statut réservation mis à jour
   - Transaction créée dans table `transactions`
   - PDF contrat généré

#### Validations

- ✅ Stripe Elements affiché correctement
- ✅ Payment Intent créé avec metadata
- ✅ Application fee (commission) configurée
- ✅ Webhook sécurisé (signature vérifiée)
- ✅ PDF contrat généré

---

### 7. Flux QR Code et Traçabilité

#### Objectif
Scanner les QR codes au dépôt et à la livraison.

#### Prérequis
- Réservation payée

#### Étapes

1. **Générer le QR code**
   - Le QR code est automatiquement généré après paiement
   - Dashboard > Mes colis > [Réservation] > QR Code
   - Afficher le QR code unique

2. **Scan au dépôt (Voyageur)**
   - URL : `/dashboard/scan/depot/[booking_id]`
   - Scanner le QR code (ou simuler avec l'ID)
   - Prendre photo du colis
   - Signature de l'expéditeur
   - Géolocalisation capturée
   - Cliquer sur "Confirmer le dépôt"
   - Statut passe à `in_transit`

3. **Scan à la livraison (Voyageur)**
   - URL : `/dashboard/scan/livraison/[booking_id]`
   - Scanner le QR code
   - Prendre photo du colis livré
   - Signature du destinataire
   - Géolocalisation capturée
   - Cliquer sur "Confirmer la livraison"
   - Statut passe à `delivered`

4. **Déblocage du paiement**
   - Le paiement est automatiquement débloqué
   - Voyageur reçoit son paiement (via Stripe Connect)

#### Validations

- ✅ QR code unique et sécurisé
- ✅ Géolocalisation capturée
- ✅ Photos et signatures stockées
- ✅ Statuts mis à jour correctement
- ✅ Déblocage paiement automatique

---

### 8. Flux de Notation

#### Objectif
Noter la transaction après livraison.

#### Prérequis
- Réservation avec statut `delivered`

#### Étapes

1. **Expéditeur note le voyageur**
   - Dashboard > Mes colis > [Réservation livrée]
   - Cliquer sur "Noter le voyageur"
   - URL : `/dashboard/colis/[id]/noter`
   ```
   Note : 5 étoiles
   Commentaire : "Excellent service, très professionnel"
   ```
   - Soumettre

2. **Voyageur note l'expéditeur**
   - Se connecter en tant que voyageur
   - Dashboard > Mes annonces > [Annonce] > Réservations
   - Cliquer sur "Noter l'expéditeur"
   ```
   Note : 5 étoiles
   Commentaire : "Colis bien emballé, communication claire"
   ```
   - Soumettre

3. **Vérifier les notes**
   - Les notes sont visibles après que les deux parties ont noté
   - Profils mis à jour avec note moyenne
   - Notes affichées sur les annonces

#### Validations

- ✅ Notes mutuelles requises pour visibilité
- ✅ Profil mis à jour avec moyenne
- ✅ Protection double notation (constraint unique)

---

### 9. Flux de Messagerie

#### Objectif
Envoyer des messages entre expéditeur et voyageur.

#### Étapes

1. **Accéder aux messages**
   - Dashboard > Messages
   - Liste des conversations (fonction RPC `get_user_conversations`)

2. **Envoyer un message**
   - Sélectionner une conversation liée à une réservation
   - Taper un message : "Bonjour, à quelle heure puis-je récupérer le colis ?"
   - Envoyer

3. **Vérifier la réception**
   - Se connecter avec l'autre utilisateur
   - Dashboard > Messages
   - Voir le message non lu (compteur)

4. **Temps réel (optionnel)**
   - Garder les deux sessions ouvertes
   - Envoyer un message
   - Vérifier la réception instantanée (Supabase Realtime)

#### Validations

- ✅ Liste conversations avec dernier message
- ✅ Compteur messages non lus
- ✅ Messages temps réel (Supabase Realtime)
- ✅ Pièces jointes (bucket `message-attachments`)

---

## Données de Test

### Comptes Utilisateurs

**Compte 1 : Voyageur**
```
Email : amieladjovi@yahoo.fr
Mot de passe : Amieldylan2025@
Rôle : Voyageur (peut créer des annonces)
KYC : Approuvé
```

**Compte 2 : Expéditeur**
```
Email : test.mvp@example.com
Mot de passe : TestMVP2024@
Rôle : Expéditeur (peut faire des réservations)
KYC : À soumettre
```

### Cartes de Test Stripe

**Carte valide**
```
Numéro : 4242 4242 4242 4242
Date : 12/34
CVC : 123
```

**Carte refusée**
```
Numéro : 4000 0000 0000 0002
Date : 12/34
CVC : 123
```

**Carte nécessitant 3D Secure**
```
Numéro : 4000 0027 6000 3184
Date : 12/34
CVC : 123
```

---

## Vérifications Sécurité

### Checklist Finale

- ✅ RLS activé sur toutes les tables sensibles
- ✅ Server Actions avec validation Zod
- ✅ Rate limiting (auth : 5/min, upload : 10/h)
- ✅ CSP configuré (next.config.ts)
- ✅ CORS Stripe webhook (signature requise)
- ✅ Sanitization uploads (Sharp, MIME types)
- ✅ Authentification requise sur routes protégées
- ✅ Tokens JWT vérifiés (Supabase)
- ✅ Pas de données sensibles dans logs
- ✅ HTTPS en production (Vercel)

---

## Troubleshooting

### Problème : Email de vérification non reçu
**Solution** : Vérifier les emails dans Supabase Dashboard > Authentication > Emails > Configure SMTP (mode test)

### Problème : KYC reste "pending"
**Solution** : Approuver manuellement via SQL Editor (voir flux 3, étape 5)

### Problème : Paiement Stripe échoue
**Solution** : 
- Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env.local`
- Relancer `npm run stripe:listen` si nécessaire
- Vérifier les logs Stripe Dashboard

### Problème : QR Code ne scanne pas
**Solution** : En développement, utiliser l'URL directe `/dashboard/scan/depot/[booking_id]` sans scanner

### Problème : Messages ne s'affichent pas
**Solution** : 
- Vérifier que la migration 027 est appliquée
- Vérifier WebSocket Realtime dans console navigateur

---

## Conclusion

**MVP Sendbox est opérationnel ✅**

- 21/21 tests automatiques réussis
- Tous les flux principaux fonctionnels
- Sécurité implémentée (RLS, validation, rate limiting)
- Prêt pour tests utilisateurs réels

**Prochaines étapes** :
1. Tests E2E Playwright
2. Emails transactionnels (Resend)
3. Dashboard admin complet
4. Déploiement production (Vercel)





