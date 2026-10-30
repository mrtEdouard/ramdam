import { BadRequestException } from '@nestjs/common';
import { inscriptionSchema } from '@ramdam/shared';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const pipe = new ZodValidationPipe(inscriptionSchema);

const valide = {
  email: 'lea@ramdam.test',
  pseudo: 'lea.anim',
  motDePasse: 'Veillee-2027!',
  role: 'ANIMATEUR',
  cguAcceptees: true,
};

function erreursPour(corps: unknown) {
  try {
    pipe.transform(corps);
  } catch (erreur) {
    expect(erreur).toBeInstanceOf(BadRequestException);
    const reponse = (erreur as BadRequestException).getResponse() as {
      erreurs: { champ: string }[];
    };
    return reponse.erreurs.map((e) => e.champ);
  }
  throw new Error('Le pipe aurait dû refuser ces données');
}

describe('ZodValidationPipe avec inscriptionSchema', () => {
  it('laisse passer des données valides et retire les champs inconnus', () => {
    expect(pipe.transform({ ...valide, xp: 9999 })).toEqual(valide);
  });

  it("refuse qu'on s'inscrive en ADMIN", () => {
    expect(erreursPour({ ...valide, role: 'ADMIN' })).toEqual(['role']);
  });

  it('refuse un mot de passe trop faible', () => {
    expect(erreursPour({ ...valide, motDePasse: 'motdepasse' })).toEqual([
      'motDePasse',
      'motDePasse',
      'motDePasse',
      'motDePasse',
    ]);
  });

  it('refuse un pseudo avec des caractères interdits', () => {
    expect(erreursPour({ ...valide, pseudo: 'léa anim' })).toEqual(['pseudo']);
  });

  it('refuse une inscription sans acceptation des CGU', () => {
    expect(erreursPour({ ...valide, cguAcceptees: false })).toEqual(['cguAcceptees']);
  });
});
