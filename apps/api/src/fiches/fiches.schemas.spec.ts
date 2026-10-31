import { creerFicheSchema, filtresFichesSchema, modifierFicheSchema } from '@ramdam/shared';

// Les règles de validation des fiches sont dans packages/shared ; elles sont testées ici.
const valide = {
  titre: 'Rallye nature',
  type: 'JEU',
  ageMin: 6,
  ageMax: 12,
  dureeMinutes: 90,
  deroulement: 'Retrouver les éléments de la nature photographiés.',
  publier: true,
};

const champsEnErreur = (resultat: {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
}) => resultat.error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('creerFicheSchema', () => {
  it('accepte une fiche complète et transforme un texte facultatif vide en null', () => {
    const resultat = creerFicheSchema.parse({ ...valide, materiel: '   ' });
    expect(resultat.materiel).toBeNull();
  });

  it('refuse un âge minimum supérieur au maximum (RG-07)', () => {
    expect(
      champsEnErreur(creerFicheSchema.safeParse({ ...valide, ageMin: 12, ageMax: 6 })),
    ).toEqual(['ageMax']);
  });

  it('refuse un âge hors de 3 à 17 ans et une durée hors de 5 minutes à 24 heures', () => {
    const resultat = creerFicheSchema.safeParse({ ...valide, ageMin: 2, dureeMinutes: 2000 });
    expect(champsEnErreur(resultat)).toEqual(['ageMin', 'dureeMinutes']);
  });

  it('refuse un type inconnu et un déroulement trop court', () => {
    const resultat = creerFicheSchema.safeParse({ ...valide, type: 'DANSE', deroulement: 'Court' });
    expect(champsEnErreur(resultat)).toEqual(['type', 'deroulement']);
  });
});

describe('modifierFicheSchema', () => {
  it("accepte de ne modifier qu'un seul champ", () => {
    expect(modifierFicheSchema.safeParse({ titre: 'Loup-garou géant' }).success).toBe(true);
  });
});

describe('filtresFichesSchema', () => {
  it("convertit les filtres de l'adresse en nombres et met des valeurs par défaut", () => {
    expect(filtresFichesSchema.parse({ age: '8', type: 'VEILLEE' })).toEqual({
      age: 8,
      type: 'VEILLEE',
      page: 1,
      parPage: 20,
    });
  });

  it('limite le nombre de fiches par page à 50', () => {
    expect(filtresFichesSchema.safeParse({ parPage: '500' }).success).toBe(false);
  });
});
