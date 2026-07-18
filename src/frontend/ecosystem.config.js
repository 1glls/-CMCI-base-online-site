/**
 * Configuration PM2 du frontend en production.
 *
 * PM2 ne relit pas ce fichier a chaud : il conserve sa propre copie dans
 * ~/.pm2/dump.pm2. Ce fichier est donc la recette permettant de recreer le
 * service si le dump PM2 est perdu ou si le VPS est reconstruit :
 *
 *   pm2 start ecosystem.config.js && pm2 save
 *
 * Le backend, lui, est lance directement (server.js, port defini par le
 * .env du serveur) et n'a pas d'entree ici.
 */
module.exports = {
  apps: [{
    name: 'cmci-frontend',
    script: 'npm',
    args: 'start -- -p 3001',   // Nginx fait le reverse proxy vers ce port
    cwd: '/home/root/applications/cmci-belgique-website/src/frontend',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://api.cmcibelgique.org'
    }
  }]
}
