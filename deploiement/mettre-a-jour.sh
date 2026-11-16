#!/usr/bin/env bash
# Seule commande autorisée pour la clé SSH de GitHub Actions (« commande forcée » dans
# /root/.ssh/authorized_keys) : récupère la dernière version de main puis redéploie.
# Installé sur le serveur dans /usr/local/bin/deployer-ramdam.
set -euo pipefail
cd /var/www/ramdam/app

if [ ! -d .git ]; then
  git init -q
  git remote add origin https://github.com/mrtEdouard/ramdam.git
fi
git fetch -q origin main
# reset --hard aligne le code sur main ; les fichiers non suivis (.env, node_modules) restent.
git reset -q --hard origin/main

bash deploiement/deployer.sh
