import { z } from 'zod';

// Commentaires sous une fiche : les mêmes règles que la table commentaire (contenu de 1 à 1000
// caractères). parentId est donné pour une réponse (RG-11).
export const commentaireSchema = z.object({
  contenu: z
    .string()
    .trim()
    .min(1, 'Écris quelque chose avant d’envoyer')
    .max(1000, '1000 caractères maximum'),
  parentId: z.guid().optional(),
});

export type CommentaireDto = z.infer<typeof commentaireSchema>;

export type Reponse = {
  id: string;
  auteur: string;
  auteurAvatar: string | null;
  contenu: string;
  creeLe: string;
  // Vrai si c'est le mien : je peux alors le supprimer.
  estAMoi: boolean;
};

// Un commentaire et ses réponses, de la plus ancienne à la plus récente (un seul niveau).
export type Commentaire = Reponse & { reponses: Reponse[] };

// Réponse de l'API après un envoi : le commentaire créé et l'XP éventuellement gagnée (RG-25).
export type CommentaireEnvoye = { commentaire: Reponse; xpGagne: number };
