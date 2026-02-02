#!/bin/bash

# Script pour lancer le serveur de développement avec Stripe CLI automatiquement configuré
# Usage: npm run dev:stripe

set -e

echo "🚀 Démarrage de Sendbox avec Stripe CLI..."
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Stripe CLI est installé
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI n'est pas installé${NC}"
    echo ""
    echo "Installez-le avec:"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    exit 1
fi

echo -e "${BLUE}📡 Connexion à Stripe...${NC}"

# Vérifier que l'utilisateur est connecté à Stripe
if ! stripe config --list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vous devez vous connecter à Stripe${NC}"
    echo ""
    stripe login
fi

echo -e "${GREEN}✅ Connecté à Stripe${NC}"
echo ""

# Fichier temporaire pour stocker le secret
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

echo -e "${BLUE}🔗 Démarrage du webhook forwarding...${NC}"

# Événements Stripe écoutés (alignés sur app/api/webhooks/stripe/route.ts)
EVENTS="account.updated,\
identity.verification_session.processing,\
identity.verification_session.verified,\
identity.verification_session.requires_input,\
identity.verification_session.canceled,\
identity.verification_session.redacted,\
payment_intent.succeeded,\
payment_intent.payment_failed,\
charge.refunded,\
transfer.created,\
transfer.updated,\
transfer.reversed"

# Lancer stripe listen en arrière-plan et capturer le secret
stripe listen \
  --events "$EVENTS" \
  --forward-to localhost:3000/api/webhooks/stripe \
  --forward-connect-to localhost:3000/api/webhooks/stripe \
  --print-secret > "$TEMP_FILE" 2>&1 &
STRIPE_PID=$!

# Attendre que le secret soit disponible (max 10 secondes)
COUNTER=0
while [ $COUNTER -lt 20 ]; do
    if grep -q "whsec_" "$TEMP_FILE"; then
        break
    fi
    sleep 0.5
    COUNTER=$((COUNTER + 1))
done

# Extraire le secret
WEBHOOK_SECRET=$(grep -o "whsec_[a-f0-9]*" "$TEMP_FILE" | head -1)

if [ -z "$WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ Impossible de récupérer le webhook secret${NC}"
    kill $STRIPE_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Webhook secret récupéré${NC}"
echo -e "${BLUE}   Secret: ${WEBHOOK_SECRET:0:15}...${NC}"
echo ""

# Mettre à jour .env.local
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Fichier .env.local non trouvé, création...${NC}"
    touch "$ENV_FILE"
fi

# Sauvegarder l'ancien fichier
cp "$ENV_FILE" "$ENV_FILE.backup"

# Supprimer l'ancienne ligne STRIPE_WEBHOOK_SECRET si elle existe
grep -v "^STRIPE_WEBHOOK_SECRET=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
mv "$ENV_FILE.tmp" "$ENV_FILE"

# Ajouter la nouvelle valeur
echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET" >> "$ENV_FILE"

echo -e "${GREEN}✅ .env.local mis à jour${NC}"
echo ""

# Fonction de nettoyage à l'arrêt
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Arrêt des services...${NC}"

    # Tuer le processus Stripe
    kill $STRIPE_PID 2>/dev/null || true

    # Restaurer l'ancien .env.local
    if [ -f "$ENV_FILE.backup" ]; then
        mv "$ENV_FILE.backup" "$ENV_FILE"
        echo -e "${GREEN}✅ .env.local restauré${NC}"
    fi

    echo -e "${GREEN}✅ Services arrêtés proprement${NC}"
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}🌐 Démarrage du serveur Next.js...${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Serveur prêt !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}📱 Application:${NC}      http://localhost:3000"
echo -e "  ${BLUE}🔔 Webhooks Stripe:${NC}  Actifs et configurés"
echo ""
echo -e "${YELLOW}💡 Appuyez sur Ctrl+C pour arrêter tous les services${NC}"
echo ""

# Lancer Next.js (bloquant)
npm run dev

# Si Next.js s'arrête, nettoyer
cleanup
