#!/usr/bin/env bash
# Déploiement de Ramdam sur le VPS, lancé dans /var/www/ramdam/app après la copie du code.
# Étapes : dépendances, génération, migrations de la base, compilation, puis bascule sans coupure.
set -euo pipefail
cd /var/www/ramdam/app

URL_PUBLIQUE="${URL_PUBLIQUE:-https://v2202609408683511116.supersrv.de}"

echo "→ Dépendances"
corepack enable
pnpm install --frozen-lockfile

echo "→ Schémas partagés, client Prisma, moteur Skia"
pnpm generate

echo "→ Migrations de la base"
MIGRER_PSQL="sudo -u postgres psql -d ramdam" node scripts/migrer.mjs

echo "→ Compilation de l'API"
pnpm --filter @ramdam/api build

echo "→ Compilation de l'app web"
# L'app est compilée dans un dossier à part, puis mise en place d'un coup :
# les visiteurs ne voient jamais une version à moitié copiée.
rm -rf /var/www/ramdam/web.nouveau
EXPO_PUBLIC_API_URL="$URL_PUBLIQUE/api" pnpm --filter @ramdam/mobile exec \
  expo export --platform web --output-dir /var/www/ramdam/web.nouveau
cp apps/mobile/public/canvaskit.wasm /var/www/ramdam/web.nouveau/ 2>/dev/null || true
rm -rf /var/www/ramdam/web.ancien
[ -d /var/www/ramdam/web ] && mv /var/www/ramdam/web /var/www/ramdam/web.ancien
mv /var/www/ramdam/web.nouveau /var/www/ramdam/web

echo "→ Redémarrage de l'API"
pm2 startOrReload deploiement/ecosystem.config.cjs
pm2 save

echo "✓ Ramdam déployé sur $URL_PUBLIQUE"
