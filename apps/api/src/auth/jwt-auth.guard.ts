import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

// Contenu d'un jeton signé par AuthService.
export type UtilisateurJwt = { sub: string; role: 'ANIMATEUR' | 'DIRECTEUR' | 'ADMIN' };

export type RequeteAuthentifiee = Request & { utilisateur: UtilisateurJwt };

// Laisse passer seulement les requêtes qui portent un JWT valide dans l'en-tête
// « Authorization: Bearer <jeton> », et accroche son contenu à la requête.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(contexte: ExecutionContext) {
    const requete = contexte.switchToHttp().getRequest<RequeteAuthentifiee>();
    const [type, jeton] = requete.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !jeton) {
      throw new UnauthorizedException('Connexion requise');
    }

    try {
      // verifyAsync contrôle la signature et la date d'expiration.
      requete.utilisateur = await this.jwt.verifyAsync<UtilisateurJwt>(jeton);
    } catch {
      throw new UnauthorizedException('Session expirée, reconnecte-toi');
    }
    return true;
  }
}
