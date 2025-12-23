# Guide des Tests E2E

Ce document décrit comment exécuter et maintenir les tests End-to-End avec Playwright.

## Installation

```bash
npm install -D @playwright/test
npx playwright install
```

## Structure des tests

```
e2e/
├── helpers/
│   ├── auth.ts          # Helpers d'authentification
│   └── fixtures.ts      # Données de test
├── auth/
│   └── signup.spec.ts   # Tests inscription & KYC
├── announcements/
│   └── create.spec.ts   # Tests création annonce
├── bookings/
│   └── complete-flow.spec.ts  # Tests réservation complète
└── admin/
    ├── kyc-approval.spec.ts   # Tests validation KYC admin
    └── users.spec.ts          # Tests gestion utilisateurs
```

## Exécution des tests

### Tous les tests
```bash
npm run test:e2e
```

### Mode UI interactif
```bash
npm run test:e2e:ui
```

### Mode headed (avec navigateur visible)
```bash
npm run test:e2e:headed
```

### Mode debug
```bash
npm run test:e2e:debug
```

### Voir le rapport HTML
```bash
npm run test:e2e:report
```

## Configuration

Les tests sont configurés dans `playwright.config.ts` :

- **Base URL** : `http://localhost:3000` (ou `PLAYWRIGHT_TEST_BASE_URL`)
- **Retries** : 2 en CI, 0 en local
- **Workers** : 1 en CI, parallèle en local
- **Browsers** : Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

## Variables d'environnement

Créer un fichier `.env.test` :

```env
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
ADMIN_EMAIL=admin@sendbox.com
ADMIN_PASSWORD=your-admin-password
```

## Parcours testés

### 1. Inscription & KYC
- ✅ Inscription utilisateur
- ✅ Validation formulaire
- ✅ Soumission KYC
- ✅ Affichage statut KYC

### 2. Création d'annonce
- ✅ Création annonce complète (3 étapes)
- ✅ Validation formulaire
- ✅ Vérification KYC requis

### 3. Réservation complète
- ✅ Recherche d'annonces
- ✅ Affichage détails annonce
- ✅ Création réservation
- ✅ Paiement Stripe (mode test)

### 4. Administration
- ✅ Visualisation liste KYC
- ✅ Approbation KYC
- ✅ Rejet KYC avec raison
- ✅ Gestion utilisateurs (ban, rôle)

## Best Practices

1. **Isolation** : Chaque test est indépendant
2. **Fixtures** : Utiliser les helpers et fixtures pour la réutilisabilité
3. **Sélecteurs** : Préférer les sélecteurs stables (data-testid, aria-labels)
4. **Attentes** : Toujours attendre les éléments avant interaction
5. **Nettoyage** : Nettoyer les cookies/données entre tests

## CI/CD

Les tests s'exécutent automatiquement sur :
- Push sur `main` ou `develop`
- Pull Requests
- Workflow manuel

Voir `.github/workflows/e2e.yml` pour la configuration complète.

## Dépannage

### Tests qui échouent de manière intermittente
- Augmenter les timeouts
- Vérifier la stabilité des sélecteurs
- Ajouter des `waitFor` explicites

### Problèmes avec Stripe Elements
- Utiliser `frameLocator` pour accéder aux iframes
- Attendre le chargement complet des éléments

### Problèmes d'authentification
- Vérifier que les utilisateurs de test existent
- Utiliser les helpers d'authentification fournis









