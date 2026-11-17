import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

// Un faux contexte de requête, avec l'utilisateur déjà accroché par JwtAuthGuard.
const contexte = (role: string) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ utilisateur: { sub: 'id', role } }) }),
  }) as unknown as ExecutionContext;

const garde = (roles: string[] | undefined) =>
  new RolesGuard({ getAllAndOverride: () => roles } as unknown as Reflector);

describe('RolesGuard', () => {
  it('laisse passer le bon rôle', () => {
    expect(garde(['DIRECTEUR']).canActivate(contexte('DIRECTEUR'))).toBe(true);
  });

  it('refuse un animateur sur une route de Directeur (403)', () => {
    expect(() => garde(['DIRECTEUR']).canActivate(contexte('ANIMATEUR'))).toThrow(
      ForbiddenException,
    );
  });

  it('laisse passer tout le monde quand la route ne demande pas de rôle', () => {
    expect(garde(undefined).canActivate(contexte('ANIMATEUR'))).toBe(true);
  });
});
