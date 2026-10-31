import { IdentifiantPipe } from './identifiant.pipe.js';

const pipe = new IdentifiantPipe();

describe('IdentifiantPipe', () => {
  it('accepte un UUID généré par PostgreSQL et un identifiant du jeu d’essai', () => {
    expect(pipe.transform('23177bd2-f43d-48c7-9c60-f6330f7ebefa')).toBe(
      '23177bd2-f43d-48c7-9c60-f6330f7ebefa',
    );
    expect(pipe.transform('10000000-0000-0000-0000-000000000001')).toBe(
      '10000000-0000-0000-0000-000000000001',
    );
  });

  it('refuse ce qui n’a pas la forme d’un UUID', () => {
    expect(() => pipe.transform('123')).toThrow('Identifiant invalide');
    expect(() => pipe.transform("1' OR '1'='1")).toThrow('Identifiant invalide');
  });
});
