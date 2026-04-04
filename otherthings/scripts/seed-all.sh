#!/bin/bash

# Script pour peupler la base de données avec des données par défaut
# Usage: ./seed-all.sh

echo "═══════════════════════════════════════════════════════════"
echo "  🌱 INITIALISATION DE LA BASE DE DONNÉES CMCI BELGIQUE"
echo "═══════════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Vérifier que le backend est démarré
echo "🔍 Vérification du backend..."
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
  echo "❌ Erreur: Le backend n'est pas démarré."
  echo "   Lancez-le avec: cd src/backend && npm start"
  exit 1
fi
echo "✅ Backend opérationnel"
echo ""

# Témoignages
echo "📝 TÉMOIGNAGES"
echo "─────────────────────────────────────────────────────────"
if [ -f "$SCRIPT_DIR/seed-testimonials.sh" ]; then
  bash "$SCRIPT_DIR/seed-testimonials.sh"
else
  echo "⚠️  Script seed-testimonials.sh non trouvé"
fi
echo ""

# Galerie
echo "📸 GALERIE"
echo "─────────────────────────────────────────────────────────"
if [ -f "$SCRIPT_DIR/seed-gallery.sh" ]; then
  bash "$SCRIPT_DIR/seed-gallery.sh"
else
  echo "⚠️  Script seed-gallery.sh non trouvé"
fi
echo ""

# Paramètres
echo "⚙️  PARAMÈTRES"
echo "─────────────────────────────────────────────────────────"
if [ -f "$SCRIPT_DIR/seed-settings.sh" ]; then
  bash "$SCRIPT_DIR/seed-settings.sh"
else
  echo "⚠️  Script seed-settings.sh non trouvé"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  ✅ INITIALISATION TERMINÉE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Vous pouvez maintenant:"
echo "   - Accéder à l'admin: http://localhost:3000/admin"
echo "   - Voir le site: http://localhost:3000"
echo ""
echo "📚 Scripts disponibles:"
echo "   - ./seed-testimonials.sh  : Ajouter des témoignages"
echo "   - ./seed-gallery.sh       : Ajouter des images"
echo "   - ./seed-settings.sh      : Ajouter des paramètres"
echo "   - ./clear-testimonials.sh : Supprimer tous les témoignages"
echo "   - ./clear-gallery.sh      : Supprimer toutes les images"
echo ""
