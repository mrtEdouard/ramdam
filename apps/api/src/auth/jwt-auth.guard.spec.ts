import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard, type RequeteAuthentifiee } from './jwt-auth.guard.js';

const jwt = new JwtService({ secret: 'secret-de-test' });
const prisma = { utilisateur: { findUnique: vi.fn() } };
const guard = new JwtAuthGuard(jwt, prisma as unknown as PrismaService);

beforeEach(() => {
  prisma.utilisateur.findUnique.mockReset();
  // Par défaut, le compte existe et il est actif.
  prisma.utilisateur.findUnique.mockResolvedValue({ role: 'DIRECTEUR', statut: 'ACTIF' });
});

// Fabrique le contexte qu'aurait Nest pour une requête avec cet en-tête Authorization.
function contexte(authorization?: string) {
  const requete = { headers: { authorization } } as RequeteAuthentifiee;
  const ctx = { switchToHttp: () => ({ getRequest: () => requete }) } as ExecutionContext;
  return { ctx, requete };
}

describe('JwtAuthGuard', () => {
  it('laisse passer un jeton valide et accroche son contenu à la requête', async () => {
    const jeton = await jwt.signAsync({ sub: 'id-1', role: 'DIRECTEUR' });
    const { ctx, requete } = contexte(`Bearer ${jeton}`);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(requete.utilisateur).toMatchObject({ sub: 'id-1', role: 'DIRECTEUR' });
  });

  it('refuse une requête sans en-tête Authorization', async () => {
    await expect(guard.canActivate(contexte().ctx)).rejects.toThrow('Connexion requise');
  });

  it('refuse un jeton signé avec une autre clé', async () => {
    const faux = await new JwtService({ secret: 'autre-cle' }).signAsync({ sub: 'id-1' });
    await expect(guard.canActivate(contexte(`Bearer ${faux}`).ctx)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuse un jeton expiré', async () => {
    const expire = await jwt.signAsync({ sub: 'id-1', exp: Math.floor(Date.now() / 1000) - 60 });
    await expect(guard.canActivate(contexte(`Bearer ${expire}`).ctx)).rejects.toThrow(
      'Session expirée, reconnecte-toi',
    );
  });

  it('refuse le jeton d’un compte supprimé', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(null);
    const jeton = await jwt.signAsync({ sub: 'id-supprime', role: 'ANIMATEUR' });
    await expect(guard.canActivate(contexte(`Bearer ${jeton}`).ctx)).rejects.toThrow(
      'Ce compte n’existe plus, reconnecte-toi',
    );
  });

  it('refuse le jeton d’un compte suspendu', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue({ role: 'ANIMATEUR', statut: 'SUSPENDU' });
    const jeton = await jwt.signAsync({ sub: 'id-1', role: 'ANIMATEUR' });
    await expect(guard.canActivate(contexte(`Bearer ${jeton}`).ctx)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('prend le rôle dans la base, pas dans le jeton', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue({ role: 'ADMIN', statut: 'ACTIF' });
    const jeton = await jwt.signAsync({ sub: 'id-1', role: 'ANIMATEUR' });
    const { ctx, requete } = contexte(`Bearer ${jeton}`);
    await guard.canActivate(ctx);
    expect(requete.utilisateur.role).toBe('ADMIN');
  });
});
