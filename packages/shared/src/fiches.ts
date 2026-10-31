import { z } from 'zod';

// Fiches d'activité : les mêmes règles que les contraintes CHECK de la table fiche (RG-07, RG-08).

export const typesFiche = ['JEU', 'GRAND_JEU', 'VEILLEE', 'MANUEL', 'SPORTIF', 'AUTRE'] as const;
export type TypeFiche = (typeof typesFiche)[number];

export const libellesTypeFiche: Record<TypeFiche, string> = {
  JEU: 'Jeu',
  GRAND_JEU: 'Grand jeu',
  VEILLEE: 'Veillée',
  MANUEL: 'Activité manuelle',
  SPORTIF: 'Sportif',
  AUTRE: 'Autre',
};

const age = z
  .number('Indique un âge')
  .int('Un âge est un nombre entier')
  .min(3, 'Âge minimum : 3 ans')
  .max(17, 'Âge maximum : 17 ans');
const participants = z
  .number()
  .int('Un nombre entier')
  .min(1, 'Au moins 1 participant')
  .max(500, '500 participants maximum');
// Un texte facultatif laissé vide devient null : la colonne est vidée, même lors d'une modification.
const texteFacultatif = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .transform((texte) => texte || null)
    .nullable()
    .optional();

const champsFiche = z.object({
  titre: z
    .string()
    .trim()
    .min(3, 'Le titre doit faire au moins 3 caractères')
    .max(120, '120 caractères maximum'),
  type: z.enum(typesFiche, 'Choisis un type d’activité'),
  ageMin: age,
  ageMax: age,
  dureeMinutes: z
    .number('Indique une durée')
    .int('Une durée en minutes entières')
    .min(5, '5 minutes minimum')
    .max(1440, '24 heures maximum'),
  // null = pas de limite (champ laissé vide).
  nbParticipantsMin: participants.nullable().optional(),
  nbParticipantsMax: participants.nullable().optional(),
  objectifs: texteFacultatif(2000),
  materiel: texteFacultatif(2000),
  deroulement: z
    .string()
    .trim()
    .min(10, 'Décris le déroulement en quelques phrases')
    .max(10000, '10 000 caractères maximum'),
  // RG-08 : une fiche est un brouillon tant que son auteur ne la publie pas.
  publier: z.boolean(),
});

type ChampsFiche = z.infer<typeof champsFiche>;

// Règles qui comparent deux champs entre eux : elles s'appliquent quand les deux sont présents.
function verifierCoherence(fiche: Partial<ChampsFiche>, ctx: z.RefinementCtx) {
  if (fiche.ageMin !== undefined && fiche.ageMax !== undefined && fiche.ageMin > fiche.ageMax) {
    ctx.addIssue({
      code: 'custom',
      path: ['ageMax'],
      message: 'L’âge maximum doit être supérieur ou égal au minimum',
    });
  }
  if (
    fiche.nbParticipantsMin != null &&
    fiche.nbParticipantsMax != null &&
    fiche.nbParticipantsMin > fiche.nbParticipantsMax
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['nbParticipantsMax'],
      message: 'Le maximum doit être supérieur ou égal au minimum',
    });
  }
}

export const creerFicheSchema = champsFiche.superRefine(verifierCoherence);

// Pour une modification, chaque champ est facultatif : on n'envoie que ce qui change.
export const modifierFicheSchema = champsFiche.partial().superRefine(verifierCoherence);

// Filtres de la liste, lus dans l'adresse (?type=VEILLEE&age=8&page=2) : tout arrive en texte,
// z.coerce le convertit en nombre.
export const filtresFichesSchema = z.object({
  type: z.enum(typesFiche).optional(),
  age: z.coerce.number().int().min(3).max(17).optional(),
  recherche: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  parPage: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreerFicheDto = z.infer<typeof creerFicheSchema>;
export type ModifierFicheDto = z.infer<typeof modifierFicheSchema>;
export type FiltresFiches = z.infer<typeof filtresFichesSchema>;

// Ce que l'API renvoie pour une carte de fiche.
export type FicheResume = {
  id: string;
  titre: string;
  type: TypeFiche;
  ageMin: number;
  ageMax: number;
  dureeMinutes: number;
  statut: 'BROUILLON' | 'PUBLIEE' | 'MASQUEE';
  publieeLe: string | null;
  auteur: string;
  aimes: number;
  imageUrl: string | null;
};

// Le détail complet d'une fiche.
export type FicheDetail = FicheResume & {
  nbParticipantsMin: number | null;
  nbParticipantsMax: number | null;
  objectifs: string | null;
  materiel: string | null;
  deroulement: string;
  estAuteur: boolean;
};

export type PageDeFiches = {
  fiches: FicheResume[];
  page: number;
  pages: number;
  total: number;
};
