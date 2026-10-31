import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequeteAuthentifiee } from './jwt-auth.guard.js';

// Donne au contrôleur l'utilisateur identifié par JwtAuthGuard :
// profil(@UtilisateurConnecte() utilisateur: UtilisateurJwt)
export const UtilisateurConnecte = createParamDecorator(
  (_donnees: unknown, contexte: ExecutionContext) =>
    contexte.switchToHttp().getRequest<RequeteAuthentifiee>().utilisateur,
);
