// Offres de démonstration, reprises du jeu d'essai (database/02_jeu_essai.sql) avec les mêmes
// identifiants. Elles seront remplacées par l'API GET /offres.

export type OffreResume = {
  id: string;
  intitule: string;
  structure: string;
  region: string;
  dateDebut: Date;
  dateFin: Date;
};

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
