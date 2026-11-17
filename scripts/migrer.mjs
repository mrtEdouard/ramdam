// Applique les migrations SQL de database/migrations qui ne l'ont pas encore été.
// Usage : pnpm db:migrer
// Sur le serveur : MIGRER_PSQL="sudo -u postgres psql -d ramdam" node scripts/migrer.mjs
//
// Chaque fichier est exécuté dans une transaction (tout ou rien), puis son nom est noté dans la
// table migration_appliquee : relancer la commande n'applique jamais deux fois la même migration.
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

// En local, psql tourne dans le conteneur Docker. Sur le serveur, PostgreSQL est installé
// directement : MIGRER_PSQL donne la commande à utiliser (ex. « sudo -u postgres psql -d ramdam »).
function psql(sql, options = []) {
  const drapeaux = `-q -t -A -v ON_ERROR_STOP=1 ${options.join(' ')}`;
  const [commande, args] = process.env.MIGRER_PSQL
    ? ['sh', ['-c', `${process.env.MIGRER_PSQL} ${drapeaux}`]]
    : [
        'docker',
        [
          'compose',
          'exec',
          '-T',
          'postgres',
          'sh',
          '-c',
          `psql ${drapeaux} -U "$POSTGRES_USER" -d "$POSTGRES_DB"`,
        ],
      ];
  const resultat = spawnSync(commande, args, { input: sql, encoding: 'utf8' });
  if (resultat.status !== 0) {
    throw new Error(resultat.stderr || 'La base ne répond pas : lance « pnpm db:up ».');
  }
  return resultat.stdout.trim();
}

psql(`CREATE TABLE IF NOT EXISTS migration_appliquee (
  nom         text PRIMARY KEY,
  appliquee_le timestamptz NOT NULL DEFAULT now()
);`);
const dejaAppliquees = new Set(
  psql('SELECT nom FROM migration_appliquee;').split('\n').filter(Boolean),
);

const fichiers = readdirSync('database/migrations')
  .filter((f) => f.endsWith('.sql'))
  .sort();
let nouvelles = 0;
for (const fichier of fichiers) {
  if (dejaAppliquees.has(fichier)) {
    continue;
  }
  // --single-transaction : si une instruction échoue, rien n'est appliqué.
  // Le nom du fichier ne contient que des caractères sûrs (numéro, lettres, tirets bas).
  if (!/^[\w.-]+$/.test(fichier)) {
    throw new Error(`Nom de migration invalide : ${fichier}`);
  }
  const sql = readFileSync(`database/migrations/${fichier}`, 'utf8');
  psql(`${sql}\nINSERT INTO migration_appliquee (nom) VALUES ('${fichier}');`, [
    '--single-transaction',
  ]);
  console.log(`Migration appliquée : ${fichier}`);
  nouvelles++;
}
console.log(nouvelles ? `${nouvelles} migration(s) appliquée(s).` : 'La base est déjà à jour.');
