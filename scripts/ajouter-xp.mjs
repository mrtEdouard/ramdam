// Outil de développement : ajoute (ou retire) de l'XP à un compte pour tester les niveaux.
// Usage : pnpm xp <pseudo> <points>     ex. pnpm xp lea.anim 500   ou   pnpm xp lea.anim -200
//
// En temps normal, l'XP n'est écrite que par les triggers de la base : l'API n'a pas le droit
// d'y toucher. Ce script passe par le compte propriétaire de la base locale (Docker), il ne doit
// jamais servir en production.
import { spawnSync } from 'node:child_process';

const [pseudo, texte] = process.argv.slice(2);
const points = Number(texte);

if (!pseudo || !Number.isInteger(points) || points === 0) {
  console.error('Usage : pnpm xp <pseudo> <points>   (points entier, négatif pour en retirer)');
  process.exit(1);
}

// Les valeurs passent par des variables psql (:'pseudo', :points) et non par du texte collé
// dans la requête : un pseudo piégé ne peut pas injecter de SQL.
const sql = `
UPDATE utilisateur SET xp = GREATEST(xp + :points, 0)
WHERE pseudo = :'pseudo'
RETURNING pseudo || ' a maintenant ' || xp || ' XP';
`;

const resultat = spawnSync(
  'docker',
  [
    'compose',
    'exec',
    '-T',
    'postgres',
    'sh',
    '-c',
    'psql -q -t -A -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v pseudo="$1" -v points="$2"',
    '--',
    pseudo,
    String(points),
  ],
  { input: sql, encoding: 'utf8' },
);

if (resultat.status !== 0) {
  console.error(resultat.stderr || 'La base ne répond pas : lance « pnpm db:up ».');
  process.exit(1);
}
const message = resultat.stdout.trim();
console.log(message || `Aucun compte avec le pseudo « ${pseudo} ».`);
process.exit(message ? 0 : 1);
