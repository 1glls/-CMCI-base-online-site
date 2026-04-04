#!/bin/bash

echo "🚀 Démarrage CMCI Belgique"
echo "=========================="
echo ""
echo "✅ Frontend: http://localhost:3000"
echo "✅ Backend:  http://localhost:5000"
echo "✅ Admin:    http://localhost:3000/admin"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

# Lancer frontend et backend
cd src/frontend && npm run dev &
FRONTEND_PID=$!

cd ../backend && npm run dev &
BACKEND_PID=$!

# Attendre et gérer l'arrêt
wait
