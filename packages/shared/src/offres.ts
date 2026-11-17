// Offres de recrutement publiées par les Directeurs (RG-15).

export const libellesTypeStructure = {
  ALSH: 'Accueil de loisirs',
  SEJOUR: 'Séjour',
  PERISCOLAIRE: 'Périscolaire',
  AUTRE: 'Autre',
} as const;

export type OffreResume = {
  id: string;
  intitule: string;
  structure: string;
  typeStructure: keyof typeof libellesTypeStructure;
  region: string;
  dateDebut: string;
  dateFin: string;
  directeur: string;
};

export type OffreDetail = OffreResume & {
  description: string;
  diplomeRequis: string | null;
  // Les candidatures se font hors de Ramdam : adresse e-mail ou lien vers la structure.
  contactExterne: string;
};
