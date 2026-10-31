// Niveaux de gamification : l'emblème du profil, un feu de camp, grandit à chaque palier.
// L'XP est attribuée par les triggers de la base (fiche publiée +50, ajoutée à une Malle +10,
// commentaire +5, fiche aimée +2) ; ce fichier ne fait que la traduire en niveau.
export const niveaux = [
  { numero: 1, nom: 'Étincelle', xpMin: 0 },
  { numero: 2, nom: 'Braise', xpMin: 100 },
  { numero: 3, nom: 'Flambée', xpMin: 300 },
  { numero: 4, nom: 'Feu de camp', xpMin: 700 },
  { numero: 5, nom: 'Grand feu', xpMin: 1500 },
  { numero: 6, nom: 'Brasier légendaire', xpMin: 3000 },
] as const;

export type Niveau = (typeof niveaux)[number];

export function niveauPour(xp: number) {
  // Le niveau atteint est le dernier palier dont le minimum est inférieur ou égal à l'XP.
  const position = niveaux.findLastIndex((niveau) => xp >= niveau.xpMin);
  const actuel = niveaux[Math.max(position, 0)];
  const suivant = niveaux[position + 1] ?? null;

  return {
    actuel,
    suivant,
    // Part du palier déjà parcourue, de 0 à 1 (1 au niveau maximum).
    progression: suivant ? (xp - actuel.xpMin) / (suivant.xpMin - actuel.xpMin) : 1,
    xpRestants: suivant ? suivant.xpMin - xp : 0,
  };
}

// Statistiques publiques d'un profil, renvoyées par GET /profils/moi et GET /profils/:pseudo.
export type Profil = {
  pseudo: string;
  role: 'ANIMATEUR' | 'DIRECTEUR' | 'ADMIN';
  xp: number;
  membreDepuis: string;
  fichesPubliees: number;
  aimesRecus: number;
};
