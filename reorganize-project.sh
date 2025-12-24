#!/bin/bash

# Script de réorganisation de l'architecture du projet Sendbox
# Ce script crée la nouvelle structure de dossiers

set -e

echo "🏗️  Création de la nouvelle architecture..."

# Créer lib/core avec tous les domaines
mkdir -p lib/core/{announcements,auth,bookings,kyc,messages,notifications,payments,profile,ratings}

# Créer lib/shared avec sous-dossiers
mkdir -p lib/shared/{config,db,security,services/{email,stripe,pdf},utils}

# Créer lib/types
mkdir -p lib/types

# Créer components/shared
mkdir -p components/shared/{forms,data-display,navigation}

# Créer tests
mkdir -p tests/{e2e,integration,unit}

# Réorganiser scripts
mkdir -p scripts/{dev,db,setup}

echo "✅ Structure de dossiers créée avec succès!"
echo ""
echo "📋 Prochaines étapes manuelles :"
echo "   1. Migrer les fichiers de lib/actions/ vers lib/core/{domain}/actions.ts"
echo "   2. Migrer les fichiers de lib/utils/ vers lib/shared/utils/ ou lib/core/{domain}/utils.ts"
echo "   3. Déplacer e2e/ vers tests/e2e/"
echo "   4. Réorganiser les scripts dans scripts/{dev,db,setup}/"
echo "   5. Mettre à jour les imports dans tout le projet"
echo "   6. Lancer 'npm run build' pour vérifier"
