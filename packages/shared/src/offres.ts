import { z } from 'zod';

// Offres de recrutement publiées par les Directeurs (RG-15).
// Les mêmes règles que la table offre : longueurs, dates cohérentes (RG-16).

export const typesStructure = ['ALSH', 'SEJOUR', 'PERISCOLAIRE', 'AUTRE'] as const;
export type TypeStructure = (typeof typesStructure)[number];

export const libellesTypeStructure = {
  ALSH: 'Accueil de loisirs',
  SEJOUR: 'Séjour',
  PERISCOLAIRE: 'Périscolaire',
  AUTRE: 'Autre',
} as const;

// Les 13 régions de métropole, plus l'outre-mer : une liste fermée évite « IDF », « Ile de France »…
export const regions = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d’Azur',
  'Outre-mer',
] as const;
export type Region = (typeof regions)[number];

// Diplômes proposés en un appui ; on peut aussi en écrire un autre.
export const suggestionsDiplome = [
  'BAFA',
  'BAFA ou stagiaire',
  'BAFD',
  'BPJEPS',
  'Surveillant de baignade',
];

// Une date sans heure, au format AAAA-MM-JJ (celui de la colonne date de PostgreSQL).
const jour = z.iso.date('Date invalide, écris-la comme 14/07/2027');

// Le contact sert à candidater hors de Ramdam : un e-mail ou un lien vers le site de la structure.
const estEmail = (texte: string) => z.email().safeParse(texte).success;
const estLien = (texte: string) => /^https?:\/\/\S+\.\S+$/.test(texte);

export const offreSchema = z
  .object({
    intitule: z
      .string()
      .trim()
      .min(3, 'Donne un intitulé au poste')
      .max(120, '120 caractères maximum'),
    structure: z
      .string()
      .trim()
      .min(2, 'Indique le nom de la structure')
      .max(120, '120 caractères maximum'),
    typeStructure: z.enum(typesStructure, 'Choisis le type de structure'),
    region: z.enum(regions, 'Choisis une région'),
    dateDebut: jour,
    dateFin: jour,
    description: z
      .string()
      .trim()
      .min(20, 'Décris le poste en quelques phrases (20 caractères minimum)')
      .max(5000, '5000 caractères maximum'),
    diplomeRequis: z.string().trim().max(60, '60 caractères maximum').nullable(),
    contactExterne: z
      .string()
      .trim()
      .max(255, '255 caractères maximum')
      .refine(
        (texte) => estEmail(texte) || estLien(texte),
        'Une adresse e-mail ou un lien commençant par https://',
      ),
  })
  .superRefine((offre, ctx) => {
    // Les dates AAAA-MM-JJ se comparent comme du texte : '2027-07-01' < '2027-07-14'.
    if (offre.dateFin < offre.dateDebut) {
      ctx.addIssue({
        code: 'custom',
        path: ['dateFin'],
        message: 'La fin doit être après le début', // RG-16
      });
    }
    if (offre.dateFin < new Date().toISOString().slice(0, 10)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dateFin'],
        message: 'Cette date est déjà passée',
      });
    }
  });

export type OffreDto = z.infer<typeof offreSchema>;

// Filtres de la liste, lus dans l'adresse (?region=Bretagne&mois=2027-07&page=2).
export const filtresOffresSchema = z.object({
  region: z.enum(regions).optional(),
  typeStructure: z.enum(typesStructure).optional(),
  // Période : les offres qui ont au moins un jour dans ce mois (AAAA-MM).
  mois: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  parPage: z.coerce.number().int().min(1).max(20).default(10),
});

export type FiltresOffres = z.infer<typeof filtresOffresSchema>;

export type StatutOffre = 'OUVERTE' | 'CLOTUREE';

export type OffreResume = {
  id: string;
  intitule: string;
  structure: string;
  typeStructure: TypeStructure;
  region: string;
  dateDebut: string;
  dateFin: string;
  directeur: string;
  statut: StatutOffre;
  // Première photo de l'offre, en vignette dans la liste ; null s'il n'y en a pas.
  photoUrl: string | null;
};

export type OffreDetail = OffreResume & {
  description: string;
  diplomeRequis: string | null;
  // Les candidatures se font hors de Ramdam : adresse e-mail ou lien vers la structure.
  contactExterne: string;
  photos: PhotoOffre[];
  // Vrai pour le Directeur qui l'a publiée : il peut la modifier, la clôturer, la supprimer.
  estAMoi: boolean;
};

export type PhotoOffre = { id: string; url: string };

// RG-27 : 6 photos au plus par offre (le séjour, les locaux, une activité…).
export const PHOTOS_PAR_OFFRE = 6;

export type PageDOffres = {
  offres: OffreResume[];
  page: number;
  pages: number;
  total: number;
};
