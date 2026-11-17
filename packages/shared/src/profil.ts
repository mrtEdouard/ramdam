import { z } from 'zod';

// Modifier son profil : pour l'instant la bio (la photo est envoyée à part, en multipart).
// 300 caractères : la même limite que la colonne utilisateur.bio.
export const modifierProfilSchema = z.object({
  bio: z.string().trim().max(300, '300 caractères maximum').nullable(),
});
export type ModifierProfilDto = z.infer<typeof modifierProfilSchema>;

// RGPD : supprimer son compte. On redemande le mot de passe : un téléphone resté ouvert
// ne doit pas suffire pour effacer le compte de quelqu'un.
export const supprimerCompteSchema = z.object({
  motDePasse: z.string().min(1, 'Entre ton mot de passe').max(128),
});
export type SupprimerCompteDto = z.infer<typeof supprimerCompteSchema>;
