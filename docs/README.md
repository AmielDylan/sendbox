# Documentation Sendbox

Documentation technique complète du projet Sendbox.

## 📄 Fichiers Principaux

### Guides de Démarrage

- **SETUP.md** - Guide de configuration initiale
  - Configuration Supabase
  - Variables d'environnement
  - Structure des routes

### Documentation Technique

- **RPC_FUNCTIONS.md** - Fonctions RPC Supabase ✅
  - Documentation complète des fonctions RPC
  - Exemples d'utilisation
  - Guide de test et dépannage

- **TESTING.md** - Guide des tests E2E ✅
  - Configuration Playwright
  - Structure des tests
  - Exécution et CI/CD

- **ARCHITECTURE.md** - Architecture complète (à créer)
  - Stack technique
  - Modèle de données
  - Workflows métier
  - Sécurité & déploiement

- **CURSOR_PROMPTS.md** - Prompts Cursor par sprint (à créer)
  - Prompts prêts à l'emploi
  - Organisés en sprints
  - Instructions détaillées

### Référence SQL

- **sendbox_schema.sql** - Schéma PostgreSQL complet (à créer)
  - Tables (profiles, announcements, bookings, etc.)
  - Row Level Security (RLS)
  - Triggers et fonctions
  - Commentaires détaillés

## 🏛️ Architecture Decision Records (ADR)

Les ADR documentent les décisions architecturales importantes.

### ADR Disponibles

- `ADR/001-choix-supabase.md` - Pourquoi Supabase vs Xano
- `ADR/002-structure-projet.md` - Organisation du code

### Format ADR

Chaque ADR suit le format :

1. **Contexte** - Pourquoi la décision ?
2. **Décision** - Quelle solution ?
3. **Conséquences** - Quels impacts ?
4. **Alternatives** - Autres options considérées

## 📚 Lecture Recommandée

**Pour démarrer** (1h) :

1. SETUP.md (30 min)
2. ADR/001-choix-supabase.md (10 min)
3. sendbox_schema.sql (20 min - quand disponible)

**Pour développer** (3h) :

1. ARCHITECTURE.md (1h - quand disponible)
2. CURSOR_PROMPTS.md (2h - quand disponible)

## 🔗 Liens Externes

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Stripe Connect](https://stripe.com/docs/connect)
