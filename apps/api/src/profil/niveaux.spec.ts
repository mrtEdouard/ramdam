import { niveauPour } from '@ramdam/shared';

// Les règles de niveaux sont dans packages/shared ; elles sont testées ici, avec le reste de l'API.
describe('niveauPour', () => {
  it('place un nouveau compte au niveau 1, Étincelle', () => {
    const { actuel, suivant, progression, xpRestants } = niveauPour(0);
    expect(actuel.nom).toBe('Étincelle');
    expect(suivant?.nom).toBe('Braise');
    expect(progression).toBe(0);
    expect(xpRestants).toBe(100);
  });

  it('passe au niveau suivant pile au palier', () => {
    expect(niveauPour(99).actuel.numero).toBe(1);
    expect(niveauPour(100).actuel.numero).toBe(2);
  });

  it('calcule la progression dans le palier', () => {
    // Palier Flambée : de 300 à 700 XP, 500 XP = la moitié du chemin.
    const { actuel, progression, xpRestants } = niveauPour(500);
    expect(actuel.nom).toBe('Flambée');
    expect(progression).toBe(0.5);
    expect(xpRestants).toBe(200);
  });

  it("s'arrête au Brasier légendaire", () => {
    const { actuel, suivant, progression } = niveauPour(12_000);
    expect(actuel.nom).toBe('Brasier légendaire');
    expect(suivant).toBeNull();
    expect(progression).toBe(1);
  });
});
