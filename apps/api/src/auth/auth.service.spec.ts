import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

// On remplace la base par de fausses fonctions : le test vérifie la logique du service, pas Postgres.
const prisma = {
  utilisateur: { create: vi.fn(), findUnique: vi.fn() },
};
const jwt = new JwtService({ secret: 'secret-de-test' });
const service = new AuthService(prisma as unknown as PrismaService, jwt);

const inscription = {
  email: 'lea@ramdam.test',
  pseudo: 'lea.anim',
  motDePasse: 'Veillee-2027!',
  role: 'ANIMATEUR' as const,
  cguAcceptees: true as const,
};

async function utilisateurEnBase(statut: 'ACTIF' | 'SUSPENDU' = 'ACTIF') {
  return {
    id: '00000000-0000-0000-0000-000000000004',
    email: inscription.email,
    pseudo: inscription.pseudo,
    mot_de_passe_hash: await argon2.hash(inscription.motDePasse),
    role: 'ANIMATEUR',
    xp: 0,
    statut,
  };
}

beforeEach(() => vi.resetAllMocks());

describe('AuthService.inscrire', () => {
  it('enregistre une empreinte Argon2 et jamais le mot de passe en clair', async () => {
    prisma.utilisateur.create.mockImplementation(({ data }) => ({ ...data, id: 'id-1', xp: 0 }));

    await service.inscrire(inscription);

    const { data } = prisma.utilisateur.create.mock.calls[0][0];
    expect(data.mot_de_passe_hash).not.toBe(inscription.motDePasse);
    expect(data.mot_de_passe_hash.startsWith('$argon2id$')).toBe(true);
    expect(await argon2.verify(data.mot_de_passe_hash, inscription.motDePasse)).toBe(true);
  });

  it("renvoie un jeton et l'utilisateur sans son empreinte", async () => {
    prisma.utilisateur.create.mockImplementation(({ data }) => ({ ...data, id: 'id-1', xp: 0 }));

    const session = await service.inscrire(inscription);

    expect(session.jeton).toEqual(expect.any(String));
    expect(session.utilisateur).toEqual({
      id: 'id-1',
      pseudo: 'lea.anim',
      role: 'ANIMATEUR',
      xp: 0,
    });
  });

  it('refuse un e-mail ou un pseudo déjà utilisé', async () => {
    prisma.utilisateur.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.inscrire(inscription)).rejects.toThrow(ConflictException);
  });
});

describe('AuthService.connecter', () => {
  it('renvoie un jeton qui contient l’identifiant et le rôle', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(await utilisateurEnBase());

    const session = await service.connecter({
      email: inscription.email,
      motDePasse: inscription.motDePasse,
    });

    const contenu = await jwt.verifyAsync(session.jeton);
    expect(contenu.sub).toBe('00000000-0000-0000-0000-000000000004');
    expect(contenu.role).toBe('ANIMATEUR');
  });

  it('refuse un e-mail inconnu', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(null);

    await expect(
      service.connecter({ email: 'inconnu@ramdam.test', motDePasse: 'peu importe' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refuse un mauvais mot de passe avec le même message', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(await utilisateurEnBase());

    await expect(
      service.connecter({ email: inscription.email, motDePasse: 'Mauvais-mdp-123!' }),
    ).rejects.toThrow('E-mail ou mot de passe incorrect');
  });

  it('refuse un compte suspendu', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(await utilisateurEnBase('SUSPENDU'));

    await expect(
      service.connecter({ email: inscription.email, motDePasse: inscription.motDePasse }),
    ).rejects.toThrow(ForbiddenException);
  });
});
