// Notifications : quelqu'un a aimé une de mes fiches, l'a ajoutée à sa galerie (RG-24),
// l'a commentée ou a répondu à mon commentaire (RG-26).
export type Notification = {
  id: string;
  type: 'FICHE_AIMEE' | 'FICHE_EN_MALLE' | 'COMMENTAIRE' | 'REPONSE';
  // Pseudo de la personne qui a réagi : il mène à son profil public.
  acteur: string;
  acteurAvatar: string | null;
  fiche: { id: string; titre: string };
  lue: boolean;
  creeLe: string;
};
