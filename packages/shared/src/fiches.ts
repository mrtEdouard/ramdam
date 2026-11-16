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
// Liste de mots-clés (matériel, objectifs) : chaque mot fait 1 à 40 caractères,
// et un même mot n'apparaît qu'une fois, quelle que soit sa casse.
const motsCles = (maximum: number) =>
  z
    .array(z.string().trim().min(1, 'Mot vide').max(40, '40 caractères maximum par mot'))
    .max(maximum, `${maximum} éléments maximum`)
    .transform((mots) =>
      mots.filter(
        (mot, position) =>
          mots.findIndex((autre) => autre.toLowerCase() === mot.toLowerCase()) === position,
      ),
    );

const champsFiche = z.object({
  titre: z
    .string()
    .trim()
    .min(3, 'Le titre doit faire au moins 3 caractères')
    .max(120, '120 caractères maximum'),
  type: z.enum(typesFiche, 'Choisis un type d’activité'),
  // RG-21 : avec le type « Autre », l'auteur nomme son propre type (« Théâtre », « Jeu de piste »…).
  typePersonnalise: z
    .string()
    .trim()
    .min(2, 'Le nom du type doit faire au moins 2 caractères')
    .max(40, '40 caractères maximum')
    .nullable()
    .optional(),
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
  objectifs: motsCles(15).default([]),
  materiel: motsCles(30).default([]),
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
  if (fiche.type === 'AUTRE' && !fiche.typePersonnalise) {
    ctx.addIssue({
      code: 'custom',
      path: ['typePersonnalise'],
      message: 'Donne un nom à ton type d’activité',
    });
  }
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
// Les listes n'ont pas de valeur par défaut ici : une liste absente n'est pas modifiée.
export const modifierFicheSchema = champsFiche
  .extend({ objectifs: motsCles(15), materiel: motsCles(30) })
  .partial()
  .superRefine(verifierCoherence);

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
  typePersonnalise: string | null;
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
  objectifs: string[];
  materiel: string[];
  deroulement: string;
  photos: PhotoFiche[];
  estAuteur: boolean;
  // Pour la personne qui regarde la fiche : l'a-t-elle aimée, l'a-t-elle gardée dans sa Malle ?
  aimeeParMoi: boolean;
  dansMaMalle: boolean;
};

// Réponse après avoir aimé ou retiré son « j'aime ».
// xpGagne : XP gagnée par celui qui aime (RG-23), 0 s'il l'a déjà eue ou si sa limite du jour est atteinte.
export type EtatAime = { aimes: number; aimeeParMoi: boolean; xpGagne: number };

export type PhotoFiche = { id: string; url: string };

// RG-22 : 10 photos au plus dans la galerie d'une fiche.
export const PHOTOS_PAR_FICHE = 10;

// Nom du type à afficher : le nom choisi par l'auteur pour le type « Autre ».
export function libelleType(fiche: Pick<FicheResume, 'type' | 'typePersonnalise'>) {
  return fiche.type === 'AUTRE' && fiche.typePersonnalise
    ? fiche.typePersonnalise
    : libellesTypeFiche[fiche.type];
}

// Bulles proposées dans le formulaire ; l'auteur peut toujours ajouter les siennes.
export const suggestionsMateriel = [
  'Plots',
  'Cônes',
  'Cordes',
  'Ballons',
  'Foulards',
  'Chasubles',
  'Cerceaux',
  'Sifflet',
  'Chronomètre',
  'Balles de tennis',
  'Frisbee',
  'Bandeaux',
  'Craies',
  'Feutres',
  'Crayons',
  'Feuilles',
  'Ciseaux',
  'Colle',
  'Peinture',
  'Pinceaux',
  'Gommettes',
  'Papier crépon',
  'Pâte à modeler',
  'Cartes',
  'Dés',
  'Lampes torches',
  'Boussole',
  'Plan du site',
  'Enceinte',
  'Costumes',
];

export const suggestionsObjectifs = [
  'Coopérer',
  'Esprit d’équipe',
  'Se dépenser',
  'Motricité',
  'Respecter des règles',
  'Stratégie',
  'Concentration',
  'Écoute',
  'Communiquer',
  'Créativité',
  'Imagination',
  'Prendre confiance en soi',
  'Gérer ses émotions',
  'Se repérer dans l’espace',
  'Découvrir la nature',
  'Créer du lien',
];

export type PageDeFiches = {
  fiches: FicheResume[];
  page: number;
  pages: number;
  total: number;
};
