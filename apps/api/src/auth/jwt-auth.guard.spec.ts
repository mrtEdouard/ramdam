import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard, type RequeteAuthentifiee } from './jwt-auth.guard.js';

const jwt = new JwtService({ secret: 'secret-de-test' });
const guard = new JwtAuthGuard(jwt);

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
});
