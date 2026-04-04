#!/bin/bash

# =============================================================================
# Script de déploiement automatique pour VPS Hostinger
# CMCI Belgique Website
# =============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un message
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour demander confirmation
confirm() {
    read -p "$(echo -e ${YELLOW}$1 [y/N]: ${NC})" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# =============================================================================
# CONFIGURATION - À MODIFIER SELON VOS BESOINS
# =============================================================================

echo ""
echo "=========================================="
echo "  CMCI Belgique - Déploiement VPS"
echo "=========================================="
echo ""

# Demander les informations de connexion
read -p "IP du VPS: " VPS_IP
read -p "Utilisateur SSH (ex: cmci): " VPS_USER
read -p "Nom de domaine (ex: cmci.be): " DOMAIN_NAME

# Chemins
APP_DIR="/home/$VPS_USER/applications/cmci-belgique-website"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# =============================================================================
# ÉTAPE 1: Vérification des prérequis locaux
# =============================================================================

print_info "Vérification des prérequis locaux..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "$LOCAL_DIR/package.json" ]; then
    print_error "Ce script doit être exécuté depuis le répertoire du projet"
    exit 1
fi

# Vérifier la connexion SSH
print_info "Test de connexion SSH..."
if ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_IP" "echo 'SSH OK'" &>/dev/null; then
    print_success "Connexion SSH OK"
else
    print_error "Impossible de se connecter au VPS. Vérifiez l'IP et les identifiants."
    exit 1
fi

# =============================================================================
# ÉTAPE 2: Créer l'archive du projet
# =============================================================================

print_info "Création de l'archive du projet..."

cd "$LOCAL_DIR"
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='src/backend/prisma/dev.db' \
    --exclude='src/frontend/.next' \
    --exclude='src/backend/uploads/*' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='.env.production' \
    -czf /tmp/cmci-belgique-deploy.tar.gz .

print_success "Archive créée: /tmp/cmci-belgique-deploy.tar.gz"

# =============================================================================
# ÉTAPE 3: Upload vers le VPS
# =============================================================================

print_info "Upload de l'archive vers le VPS..."

ssh "$VPS_USER@$VPS_IP" "mkdir -p /home/$VPS_USER/applications"
scp /tmp/cmci-belgique-deploy.tar.gz "$VPS_USER@$VPS_IP:/tmp/"

print_success "Archive uploadée"

# =============================================================================
# ÉTAPE 4: Déploiement sur le VPS
# =============================================================================

print_info "Déploiement sur le VPS..."

ssh "$VPS_USER@$VPS_IP" bash << EOF
set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\${BLUE}📦 Extraction de l'archive...\${NC}"
mkdir -p $APP_DIR
cd $APP_DIR
tar -xzf /tmp/cmci-belgique-deploy.tar.gz
rm /tmp/cmci-belgique-deploy.tar.gz

echo -e "\${GREEN}✅ Extraction terminée\${NC}"

# Backend
echo -e "\${BLUE}🔧 Installation backend...\${NC}"
cd $APP_DIR/src/backend
pnpm install --prod || npm install --production

# Créer les dossiers uploads
mkdir -p uploads/events uploads/gallery uploads/testimonials uploads/ministries
chmod -R 755 uploads

echo -e "\${GREEN}✅ Backend installé\${NC}"

# Frontend
echo -e "\${BLUE}🎨 Installation et build frontend...\${NC}"
cd $APP_DIR/src/frontend
pnpm install || npm install
pnpm run build || npm run build

echo -e "\${GREEN}✅ Frontend buildé\${NC}"

EOF

print_success "Déploiement terminé"

# =============================================================================
# ÉTAPE 5: Configuration des fichiers .env
# =============================================================================

print_info "Configuration des fichiers .env..."

if confirm "Voulez-vous configurer les fichiers .env maintenant?"; then
    
    print_warning "Ouvrez une nouvelle connexion SSH et configurez:"
    echo ""
    echo "Backend .env:"
    echo "  ssh $VPS_USER@$VPS_IP"
    echo "  nano $APP_DIR/src/backend/.env"
    echo ""
    echo "Frontend .env.production:"
    echo "  nano $APP_DIR/src/frontend/.env.production"
    echo ""
    
    read -p "Appuyez sur Entrée une fois les fichiers .env configurés..."
fi

# =============================================================================
# ÉTAPE 6: Initialisation de la base de données
# =============================================================================

print_info "Initialisation de la base de données..."

if confirm "Voulez-vous initialiser la base de données maintenant?"; then
    ssh "$VPS_USER@$VPS_IP" bash << EOF
set -e
cd $APP_DIR/src/backend
npx prisma generate
npx prisma migrate deploy
echo "✅ Base de données initialisée"
EOF
    print_success "Base de données initialisée"
fi

# =============================================================================
# ÉTAPE 7: Démarrage avec PM2
# =============================================================================

print_info "Démarrage des applications avec PM2..."

if confirm "Voulez-vous démarrer les applications avec PM2?"; then
    ssh "$VPS_USER@$VPS_IP" bash << EOF
set -e

# Arrêter les anciennes instances si elles existent
pm2 delete cmci-backend 2>/dev/null || true
pm2 delete cmci-frontend 2>/dev/null || true

# Démarrer le backend
cd $APP_DIR/src/backend
pm2 start server.js --name "cmci-backend" --time

# Démarrer le frontend
cd $APP_DIR/src/frontend
pm2 start pnpm --name "cmci-frontend" -- start

# Sauvegarder
pm2 save

# Afficher le status
pm2 status
EOF
    print_success "Applications démarrées avec PM2"
fi

# =============================================================================
# ÉTAPE 8: Résumé et prochaines étapes
# =============================================================================

echo ""
echo "=========================================="
echo "  ✅ DÉPLOIEMENT TERMINÉ"
echo "=========================================="
echo ""
print_info "Prochaines étapes:"
echo ""
echo "1. Configurer Nginx:"
echo "   ssh $VPS_USER@$VPS_IP"
echo "   sudo nano /etc/nginx/sites-available/cmci-belgique"
echo ""
echo "2. Activer SSL avec Certbot:"
echo "   sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d api.$DOMAIN_NAME"
echo ""
echo "3. Créer le premier admin:"
echo "   curl -X POST http://$VPS_IP:5000/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@cmci.be\",\"password\":\"VotreMotDePasse\",\"name\":\"Admin\"}'"
echo ""
echo "4. Vérifier que tout fonctionne:"
echo "   Backend: http://$VPS_IP:5000/health"
echo "   Frontend: http://$VPS_IP:3000"
echo ""
echo "5. Consulter les logs:"
echo "   pm2 logs"
echo ""
print_warning "N'oubliez pas de configurer votre DNS pour pointer vers $VPS_IP"
echo ""
print_success "Bon déploiement! 🚀"
echo ""

# Nettoyer
rm -f /tmp/cmci-belgique-deploy.tar.gz
