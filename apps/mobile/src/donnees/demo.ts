import type { ImageSource } from 'expo-image';

// Données de démonstration, reprises du jeu d'essai (database/02_jeu_essai.sql) avec les mêmes
// identifiants. Elles seront remplacées par les appels à l'API GET /fiches et GET /offres.

export type TypeFiche = 'JEU' | 'GRAND_JEU' | 'VEILLEE' | 'MANUEL' | 'SPORTIF' | 'AUTRE';

export type FicheResume = {
  id: string;
  titre: string;
  type: TypeFiche;
  ageMin: number;
  ageMax: number;
  dureeMinutes: number;
  auteur: string;
  publieeLe: Date;
  // Nombre de « j'aime » reçus ces 7 derniers jours : sert à choisir la fiche à la une.
  aimeeCetteSemaine: number;
  image: ImageSource;
};

export type OffreResume = {
  id: string;
  intitule: string;
  structure: string;
  region: string;
  dateDebut: Date;
  dateFin: Date;
};

const ilYa = (jours: number) => new Date(Date.now() - jours * 24 * 60 * 60 * 1000);

export const fichesRecentes: FicheResume[] = [
  {
    id: '10000000-0000-0000-0000-000000000006',
    titre: 'Fresque collective',
    type: 'MANUEL',
    ageMin: 3,
    ageMax: 6,
    dureeMinutes: 40,
    auteur: 'julie.anim',
    publieeLe: ilYa(1),
    aimeeCetteSemaine: 0,
    image: require('@/assets/images/photos/fresque.jpg'),
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    titre: 'Cluedo géant',
    type: 'GRAND_JEU',
    ageMin: 9,
    ageMax: 14,
    dureeMinutes: 150,
    auteur: 'karim_gj',
    publieeLe: ilYa(3),
    aimeeCetteSemaine: 0,
    image: require('@/assets/images/photos/enquete.jpg'),
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    titre: 'Impro express',
    type: 'AUTRE',
    ageMin: 10,
    ageMax: 17,
    dureeMinutes: 45,
    auteur: 'tom_bafa',
    publieeLe: ilYa(5),
    aimeeCetteSemaine: 0,
    image: require('@/assets/images/photos/theatre.jpg'),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    titre: 'Rallye nature',
    type: 'JEU',
    ageMin: 6,
    ageMax: 12,
    dureeMinutes: 90,
    auteur: 'lea.anim',
    publieeLe: ilYa(6),
    aimeeCetteSemaine: 1,
    image: require('@/assets/images/photos/nature.jpg'),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    titre: 'Loup-garou sous les étoiles',
    type: 'VEILLEE',
    ageMin: 8,
    ageMax: 12,
    dureeMinutes: 60,
    auteur: 'julie.anim',
    publieeLe: ilYa(8),
    aimeeCetteSemaine: 1,
    image: require('@/assets/images/photos/veillee.jpg'),
  },
  {
    id: '10000000-0000-0000-0000-000000000001',
    titre: 'La chasse au trésor du capitaine',
    type: 'GRAND_JEU',
    ageMin: 6,
    ageMax: 10,
    dureeMinutes: 120,
    auteur: 'karim_gj',
    publieeLe: ilYa(10),
    aimeeCetteSemaine: 3,
    image: require('@/assets/images/photos/foret.jpg'),
  },
];

// Seules les offres ouvertes sont affichées (l'offre « séjour mer » du jeu d'essai est clôturée).
export const offresRecentes: OffreResume[] = [
  {
    id: '30000000-0000-0000-0000-000000000002',
    intitule: 'Animateur·rice séjour montagne',
    structure: 'Altitude Jeunes',
    region: 'Auvergne-Rhône-Alpes',
    dateDebut: new Date('2027-07-05'),
    dateFin: new Date('2027-07-26'),
  },
  {
    id: '30000000-0000-0000-0000-000000000001',
    intitule: 'Animateur·rice accueil de loisirs',
    structure: 'ALSH Les Lucioles',
    region: 'Occitanie',
    dateDebut: new Date('2027-02-08'),
    dateFin: new Date('2027-07-31'),
  },
];

export const libellesTypeFiche: Record<TypeFiche, string> = {
  JEU: 'Jeu',
  GRAND_JEU: 'Grand jeu',
  VEILLEE: 'Veillée',
  MANUEL: 'Activité manuelle',
  SPORTIF: 'Sportif',
  AUTRE: 'Autre',
};
