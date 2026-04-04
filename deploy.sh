#!/bin/bash

# Script de déploiement rapide - CMCI Belgique Website
# Usage: ./deploy.sh [frontend|backend|all]

set -e  # Arrêter en cas d'erreur

# Couleurs pour la console
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="root@185.97.146.100"
VPS_PATH="/home/root/applications/cmci-belgique-website"
LOCAL_PATH="/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website"

# Fonction pour afficher les messages
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Fonction pour tester le build local
test_frontend_build() {
    info "Test du build frontend local..."
    cd "$LOCAL_PATH/src/frontend"
    
    if npm run build > /tmp/build.log 2>&1; then
        success "Build frontend OK"
        cd "$LOCAL_PATH"
        return 0
    else
        error "Build frontend FAILED"
        cat /tmp/build.log
        cd "$LOCAL_PATH"
        return 1
    fi
}

# Fonction pour déployer le frontend
deploy_frontend() {
    info "Déploiement du FRONTEND..."
    
    # Test local d'abord
    if ! test_frontend_build; then
        error "Impossible de déployer : build local échoué"
        exit 1
    fi
    
    info "Copie des fichiers frontend..."
    
    # Copier les fichiers modifiés (ajuster selon vos besoins)
    scp -r "$LOCAL_PATH/src/frontend/components" "$VPS_HOST:$VPS_PATH/src/frontend/"
    scp -r "$LOCAL_PATH/src/frontend/lib" "$VPS_HOST:$VPS_PATH/src/frontend/"
    scp -r "$LOCAL_PATH/src/frontend/contexts" "$VPS_HOST:$VPS_PATH/src/frontend/"
    scp -r "$LOCAL_PATH/src/frontend/app" "$VPS_HOST:$VPS_PATH/src/frontend/"
    
    success "Fichiers frontend copiés"
    
    info "Rebuild frontend sur VPS..."
    ssh "$VPS_HOST" << 'ENDSSH'
        cd /home/root/applications/cmci-belgique-website/src/frontend
        pm2 stop cmci-frontend
        rm -rf .next
        npm run build
        pm2 restart cmci-frontend
        sleep 3
        pm2 list | grep cmci-frontend
ENDSSH
    
    success "Frontend déployé avec succès"
}

# Fonction pour déployer le backend
deploy_backend() {
    info "Déploiement du BACKEND..."
    
    info "Copie des fichiers backend..."
    
    # Copier les routes
    scp "$LOCAL_PATH/src/backend/routes/"*.routes.js "$VPS_HOST:$VPS_PATH/src/backend/routes/"
    
    # Copier les utilitaires (image-processor, etc.)
    ssh "$VPS_HOST" "mkdir -p $VPS_PATH/src/backend/utils"
    scp "$LOCAL_PATH/src/backend/utils/"*.js "$VPS_HOST:$VPS_PATH/src/backend/utils/"
    
    # Copier les services (email, newsletter, etc.)
    scp "$LOCAL_PATH/src/backend/services/"*.js "$VPS_HOST:$VPS_PATH/src/backend/services/"
    
    # Copier le schema Prisma et les migrations
    scp "$LOCAL_PATH/src/backend/prisma/schema.prisma" "$VPS_HOST:$VPS_PATH/src/backend/prisma/"
    scp -r "$LOCAL_PATH/src/backend/prisma/migrations" "$VPS_HOST:$VPS_PATH/src/backend/prisma/"
    
    # Copier le package.json (pour les nouvelles dépendances comme sharp)
    scp "$LOCAL_PATH/src/backend/package.json" "$VPS_HOST:$VPS_PATH/src/backend/"
    
    # NE PAS copier le .env - le VPS a sa propre configuration (PORT, NODE_ENV, etc.)
    # Pour mettre à jour le .env du VPS, le faire manuellement via SSH
    warning "Le .env du VPS n'est PAS écrasé (configuration spécifique au VPS)"
    
    # Copier le serveur si modifié
    scp "$LOCAL_PATH/src/backend/server.js" "$VPS_HOST:$VPS_PATH/src/backend/"
    
    success "Fichiers backend copiés"
    
    info "Installation des dépendances et migration sur VPS..."
    ssh "$VPS_HOST" << 'ENDSSH'
        cd /home/root/applications/cmci-belgique-website/src/backend
        npm install
        npx prisma migrate deploy
        npx prisma generate
        pm2 restart cmci-backend
        sleep 3
        pm2 list | grep cmci-backend
ENDSSH
    
    success "Backend déployé avec succès"
}

# Fonction pour vérifier le déploiement
verify_deployment() {
    info "Vérification du déploiement..."
    
    # Test frontend
    if curl -s -o /dev/null -w "%{http_code}" https://www.cmcibelgique.org | grep -q "200"; then
        success "Frontend accessible (HTTP 200)"
    else
        error "Frontend NON accessible"
    fi
    
    # Test backend
    if curl -s -o /dev/null -w "%{http_code}" https://api.cmcibelgique.org/api/hero | grep -q "200"; then
        success "Backend accessible (HTTP 200)"
    else
        error "Backend NON accessible"
    fi
}

# Fonction pour afficher les logs
show_logs() {
    info "Logs du frontend (dernières 10 lignes):"
    ssh "$VPS_HOST" "pm2 logs cmci-frontend --lines 10 --nostream"
    
    echo ""
    info "Logs du backend (dernières 10 lignes):"
    ssh "$VPS_HOST" "pm2 logs cmci-backend --lines 10 --nostream"
}

# Menu principal
main() {
    echo "========================================="
    echo "  Déploiement CMCI Belgique Website"
    echo "========================================="
    echo ""
    
    case "$1" in
        frontend)
            deploy_frontend
            verify_deployment
            ;;
        backend)
            deploy_backend
            verify_deployment
            ;;
        all)
            deploy_frontend
            echo ""
            deploy_backend
            echo ""
            verify_deployment
            ;;
        logs)
            show_logs
            ;;
        test)
            test_frontend_build
            ;;
        *)
            echo "Usage: $0 {frontend|backend|all|logs|test}"
            echo ""
            echo "  frontend  - Déployer uniquement le frontend"
            echo "  backend   - Déployer uniquement le backend"
            echo "  all       - Déployer frontend + backend"
            echo "  logs      - Afficher les logs"
            echo "  test      - Tester le build local"
            exit 1
            ;;
    esac
    
    echo ""
    success "Déploiement terminé !"
    echo ""
    info "URLs:"
    echo "  Frontend: https://www.cmcibelgique.org"
    echo "  Backend:  https://api.cmcibelgique.org"
    echo "  Admin:    https://www.cmcibelgique.org/admin"
}

# Lancer le script
main "$@"
