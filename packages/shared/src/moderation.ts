import { z } from 'zod';

// Signalements (RG-20, RG-28) et modération (RG-29).

export const ciblesSignalement = ['FICHE', 'COMMENTAIRE', 'OFFRE'] as const;
export type CibleSignalement = (typeof ciblesSignalement)[number];

// Motifs proposés à la personne qui signale. « Offre douteuse » n'est proposé que pour une offre.
export const motifsSignalement = {
  INAPPROPRIE: 'Contenu choquant ou inapproprié',
  HARCELEMENT: 'Insulte ou harcèlement',
  SPAM: 'Spam ou publicité',
  FAUSSE_OFFRE: 'Offre douteuse ou mensongère',
  AUTRE: 'Autre raison',
} as const;
export type MotifSignalement = keyof typeof motifsSignalement;

export const signalementSchema = z
  .object({
    cible: z.enum(ciblesSignalement),
    cibleId: z.guid('Identifiant invalide'),
    motif: z.enum(
      Object.keys(motifsSignalement) as [MotifSignalement, ...MotifSignalement[]],
      'Choisis un motif',
    ),
    precision: z.string().trim().max(300, '300 caractères maximum').optional(),
  })
  .superRefine((signalement, ctx) => {
    // « Autre raison » ne dit rien à l'administrateur : on demande alors une précision.
    if (signalement.motif === 'AUTRE' && (signalement.precision ?? '').length < 5) {
      ctx.addIssue({ code: 'custom', path: ['precision'], message: 'Explique en quelques mots' });
    }
  });
export type SignalementDto = z.infer<typeof signalementSchema>;

// Décision de l'administrateur sur un contenu signalé.
export const decisionSchema = z.object({
  decision: z.enum(['MASQUER', 'IGNORER'], 'Décision invalide'),
});
export type DecisionDto = z.infer<typeof decisionSchema>;

// Un contenu signalé, avec tous ses signalements en attente, pour l'écran de modération.
export type ContenuSignale = {
  cible: CibleSignalement;
  cibleId: string;
  // De quoi juger sans quitter l'écran : titre (fiche, offre) ou texte (commentaire), et auteur.
  titre: string;
  extrait: string;
  auteur: string;
  // Pour ouvrir le contenu : la fiche elle-même, ou la fiche où se trouve le commentaire.
  ficheId: string | null;
  signalements: { motif: string; par: string | null; le: string }[];
};
