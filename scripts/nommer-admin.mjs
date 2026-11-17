// Donne le rôle ADMIN à un compte existant (RG-02 : on ne peut pas le choisir à l'inscription).
// Usage en local :      pnpm admin <pseudo>
// Usage sur le serveur : MIGRER_PSQL="sudo -u postgres psql -d ramdam" node scripts/nommer-admin.mjs <pseudo>
//
// Le rôle est lu dans le jeton de connexion : la personne doit se déconnecter puis se reconnecter.
import { spawnSync } from 'node:child_process';

const pseudo = process.argv[2];
if (!pseudo) {
  console.error('Usage : pnpm admin <pseudo>');
  process.exit(1);
}

// Le pseudo passe par une variable psql (:'pseudo') et non collé dans la requête : pas d'injection.
const sql = `
UPDATE utilisateur SET role = 'ADMIN'
WHERE pseudo = :'pseudo'
RETURNING pseudo || ' est maintenant administrateur (reconnexion nécessaire).';
`;

// Même principe que scripts/migrer.mjs : psql dans Docker en local, ou la commande de MIGRER_PSQL.
const drapeaux = '-q -t -A -v ON_ERROR_STOP=1 -v pseudo="$1"';
const [commande, args] = process.env.MIGRER_PSQL
  ? ['sh', ['-c', `${process.env.MIGRER_PSQL} ${drapeaux}`, '--', pseudo]]
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
        '--',
        pseudo,
      ],
    ];

const resultat = spawnSync(commande, args, { input: sql, encoding: 'utf8' });
if (resultat.status !== 0) {
  console.error(resultat.stderr || 'La base ne répond pas.');
  process.exit(1);
}
const message = resultat.stdout.trim();
console.log(message || `Aucun compte avec le pseudo « ${pseudo} ».`);
process.exit(message ? 0 : 1);
