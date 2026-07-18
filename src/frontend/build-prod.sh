#!/bin/bash
#
# Build et redemarrage du frontend EN PRODUCTION (VPS).
# A lancer sur le serveur, depuis src/frontend, apres un `git pull` :
#
#   cd /home/root/applications/cmci-belgique-website && git pull
#   cd src/frontend && ./build-prod.sh
#
# Les variables sont exportees ici parce que Next.js fige les valeurs
# NEXT_PUBLIC_* dans le bundle client au moment du build : si elles
# manquent, le site pointe vers la mauvaise API sans erreur visible.
#
# Le `rm -rf .next` est volontaire : un build incremental peut conserver
# d'anciennes valeurs d'environnement.

export NODE_ENV=production
export NEXT_PUBLIC_API_URL=https://api.cmcibelgique.org
pm2 stop cmci-frontend
rm -rf .next
npm run build
pm2 restart cmci-frontend
