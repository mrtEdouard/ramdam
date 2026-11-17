import { offreSchema } from '@ramdam/shared';

// Le schéma de packages/shared, utilisé à la fois par le formulaire et par l'API.
const valide = {
  intitule: 'Animateur séjour montagne',
  structure: 'Les Chamois',
  typeStructure: 'SEJOUR',
  region: 'Occitanie',
  ville: 'Millau',
  dateDebut: '2099-07-05',
  dateFin: '2099-07-26',
  description: 'Séjour de trois semaines avec des 8-12 ans.',
  diplomeRequis: 'BAFA',
  contactExterne: 'recrutement@chamois.fr',
};
const premiereErreur = (offre: object) => offreSchema.safeParse(offre).error?.issues[0];

describe('offreSchema', () => {
  it('accepte une offre complète, avec un e-mail ou un lien comme contact', () => {
    expect(offreSchema.safeParse(valide).success).toBe(true);
    expect(
      offreSchema.safeParse({ ...valide, contactExterne: 'https://chamois.fr/recrute' }).success,
    ).toBe(true);
  });

  it('refuse une fin avant le début (RG-16)', () => {
    expect(premiereErreur({ ...valide, dateFin: '2099-07-01' })).toMatchObject({
      path: ['dateFin'],
      message: 'La fin doit être après le début',
    });
  });

  it('refuse une offre déjà terminée', () => {
    expect(
      premiereErreur({ ...valide, dateDebut: '2020-07-01', dateFin: '2020-07-20' })?.message,
    ).toBe('Cette date est déjà passée');
  });

  it('refuse un contact qui n’est ni un e-mail ni un lien', () => {
    expect(premiereErreur({ ...valide, contactExterne: 'appelle-moi' })?.path).toEqual([
      'contactExterne',
    ]);
  });

  it('refuse une région hors de la liste', () => {
    expect(premiereErreur({ ...valide, region: 'IDF' })?.path).toEqual(['region']);
  });

  it('exige une ville', () => {
    expect(premiereErreur({ ...valide, ville: '  ' })).toMatchObject({
      path: ['ville'],
      message: 'Indique la ville',
    });
  });
});
