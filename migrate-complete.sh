#!/bin/bash

set -e

echo "🚀 Migration complète de l'architecture..."
echo ""

# Créer le dossier admin manquant
mkdir -p lib/core/admin

# ====================================
# 1. MIGRATION DES ACTIONS
# ====================================
echo "📦 1/5 Migration des actions..."

# Announcements
cp lib/actions/announcement.ts lib/core/announcements/actions.ts
cp lib/actions/announcement-management.ts lib/core/announcements/management.ts
cp lib/actions/announcement-views.ts lib/core/announcements/views.ts

# Auth
cp lib/actions/auth.ts lib/core/auth/actions.ts

# Bookings
cp lib/actions/bookings.ts lib/core/bookings/actions.ts
cp lib/actions/booking-requests.ts lib/core/bookings/requests.ts
cp lib/actions/booking-workflow.ts lib/core/bookings/workflow.ts
cp lib/actions/qr-scan.ts lib/core/bookings/qr-scan.ts

# KYC
cp lib/actions/kyc.ts lib/core/kyc/actions.ts

# Messages
cp lib/actions/messages.ts lib/core/messages/actions.ts

# Notifications
cp lib/actions/notifications.ts lib/core/notifications/actions.ts

# Profile
cp lib/actions/profile.ts lib/core/profile/actions.ts

# Ratings
cp lib/actions/rating.ts lib/core/ratings/actions.ts

# Admin
cp lib/actions/admin.ts lib/core/admin/actions.ts

# PDF
cp lib/actions/pdf-generation.ts lib/shared/services/pdf/generation.ts

echo "  ✓ Actions migrées"

# ====================================
# 2. MIGRATION DES VALIDATIONS
# ====================================
echo "📦 2/5 Migration des validations..."

cp lib/validations/announcement.ts lib/core/announcements/validations.ts
cp lib/validations/auth.ts lib/core/auth/validations.ts
cp lib/validations/booking.ts lib/core/bookings/validations.ts
cp lib/validations/kyc.ts lib/core/kyc/validations.ts
cp lib/validations/profile.ts lib/core/profile/validations.ts
cp lib/validations/rating.ts lib/core/ratings/validations.ts

echo "  ✓ Validations migrées"

# ====================================
# 3. MIGRATION DES UTILS
# ====================================
echo "📦 3/5 Migration des utilitaires..."

# Utils spécifiques aux domaines
cp lib/utils/auth.ts lib/core/auth/utils.ts
cp lib/utils/avatar.ts lib/core/profile/utils.ts
cp lib/utils/booking-calculations.ts lib/core/bookings/calculations.ts
cp lib/utils/package-photos.ts lib/core/bookings/photos.ts
cp lib/utils/qr-codes.ts lib/core/bookings/qr-codes.ts
cp lib/utils/payment-calculations.ts lib/core/payments/calculations.ts

# Utils partagés
cp lib/utils/cities.ts lib/shared/utils/cities.ts
cp lib/utils/file-upload.ts lib/shared/utils/files.ts
cp lib/utils/index.ts lib/shared/utils/index.ts

# Services
cp lib/utils/email.ts lib/shared/services/email/client.ts

# Copier Supabase dans shared/db
cp lib/supabase/client.ts lib/shared/db/client.ts
cp lib/supabase/server.ts lib/shared/db/server.ts
cp -r lib/supabase/queries lib/shared/db/

# Config
cp lib/config/features.ts lib/shared/config/features.ts

# Security
cp -r lib/security/* lib/shared/security/

# Stripe
mkdir -p lib/shared/services/stripe
cp lib/stripe/config.ts lib/shared/services/stripe/config.ts

# PDF templates
cp -r lib/pdf/* lib/shared/services/pdf/

echo "  ✓ Utilitaires migrés"

# ====================================
# 4. MIGRATION E2E → TESTS
# ====================================
echo "📦 4/5 Migration des tests..."

cp -r e2e/* tests/e2e/

echo "  ✓ Tests migrés"

# ====================================
# 5. RÉORGANISATION DES SCRIPTS
# ====================================
echo "📦 5/5 Réorganisation des scripts..."

# Scripts de dev
mv scripts/check-*.ts scripts/dev/ 2>/dev/null || true
mv scripts/test-*.ts scripts/dev/ 2>/dev/null || true

# Scripts DB
mv scripts/apply-migration-*.sh scripts/db/ 2>/dev/null || true
mv scripts/generate-types.sh scripts/db/ 2>/dev/null || true

# Scripts setup
mv scripts/stripe-*.ts scripts/setup/ 2>/dev/null || true
mv scripts/reorganize.sh scripts/setup/ 2>/dev/null || true

echo "  ✓ Scripts réorganisés"

echo ""
echo "✅ Migration terminée avec succès!"
echo ""
echo "⚠️  IMPORTANT : Prochaines étapes manuelles :"
echo "   1. Créer les fichiers de ré-export (index.ts) dans chaque domaine"
echo "   2. Mettre à jour les imports dans tout le projet"
echo "   3. Tester le build: npm run build"
echo "   4. Supprimer les anciens fichiers une fois que tout fonctionne"
