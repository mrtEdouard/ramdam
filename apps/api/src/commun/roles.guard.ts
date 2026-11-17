import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequeteAuthentifiee, UtilisateurJwt } from '../auth/jwt-auth.guard.js';

type Role = UtilisateurJwt['role'];

// @Roles('DIRECTEUR') sur une route : seuls ces rôles y ont accès.
// Le décorateur ne fait qu'écrire la liste ; c'est RolesGuard qui la lit et vérifie.
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// À placer après JwtAuthGuard, qui a déjà lu le jeton et accroché l'utilisateur à la requête :
// @UseGuards(JwtAuthGuard, RolesGuard)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexte: ExecutionContext) {
    // Les rôles demandés sur la méthode, sinon sur le contrôleur.
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>('roles', [
      contexte.getHandler(),
      contexte.getClass(),
    ]);
    // Pas de @Roles : la route est ouverte à tout utilisateur connecté.
    if (!roles) {
      return true;
    }
    const { utilisateur } = contexte.switchToHttp().getRequest<RequeteAuthentifiee>();
    if (!roles.includes(utilisateur.role)) {
      throw new ForbiddenException('Réservé aux comptes Directeur');
    }
    return true;
  }
}
