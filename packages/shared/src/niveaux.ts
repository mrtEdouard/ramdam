// Niveaux de gamification : l'emblème du profil, un feu de camp, grandit à chaque palier.
// L'XP est attribuée par les triggers de la base (fiche publiée +50, ajoutée à une galerie +10,
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
  bio: string | null;
  // Photo de profil (/images/….webp), ou null : l'app affiche alors les initiales.
  avatarUrl: string | null;
  xp: number;
  membreDepuis: string;
  fichesPubliees: number;
  aimesRecus: number;
};

// Un gain d'XP de l'historique, renvoyé par GET /profils/moi/historique-xp (privé).
export type ActionXp =
  'FICHE_PUBLIEE' | 'FICHE_EN_MALLE' | 'FICHE_AIMEE' | 'FICHE_AIMEE_DONNEE' | 'COMMENTAIRE_PUBLIE';

export type MouvementXp = {
  id: string;
  action: ActionXp;
  points: number;
  gagneLe: string;
  // La fiche concernée (absente pour un commentaire ou une fiche supprimée).
  fiche: { id: string; titre: string } | null;
  // La personne qui a déclenché le gain, si ce n'est pas soi-même.
  par: string | null;
};

// Traduit un gain en phrase lisible : « lea.anim a aimé « Béret express » ».
export function raisonXp(mouvement: MouvementXp): string {
  const fiche = mouvement.fiche ? `« ${mouvement.fiche.titre} »` : 'une fiche';
  const quelquUn = mouvement.par ?? 'Quelqu’un';
  switch (mouvement.action) {
    case 'FICHE_PUBLIEE':
      return `Tu as publié ${fiche}`;
    case 'FICHE_AIMEE':
      return `${quelquUn} a aimé ${fiche}`;
    case 'FICHE_EN_MALLE':
      return `${quelquUn} a ajouté ${fiche} à sa galerie`;
    case 'FICHE_AIMEE_DONNEE':
      return `Tu as aimé ${fiche}`;
    case 'COMMENTAIRE_PUBLIE':
      return `Tu as commenté ${fiche}`;
  }
}
