// Configuration PM2 de l'API sur le serveur : redémarrage automatique en cas d'arrêt,
// et au démarrage de la machine (pm2 save + le service pm2-root déjà installé).
module.exports = {
  apps: [
    {
      name: 'ramdam-api',
      cwd: '/var/www/ramdam/app/apps/api',
      script: 'dist/main.js',
      // Le reste de la configuration (base, JWT, CORS…) est lu dans /var/www/ramdam/app/.env.
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
    },
  ],
};
