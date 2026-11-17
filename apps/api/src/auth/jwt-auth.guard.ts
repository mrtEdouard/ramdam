import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

// Contenu d'un jeton signé par AuthService.
export type UtilisateurJwt = { sub: string; role: 'ANIMATEUR' | 'DIRECTEUR' | 'ADMIN' };

export type RequeteAuthentifiee = Request & { utilisateur: UtilisateurJwt };

// Laisse passer seulement les requêtes qui portent un JWT valide dans l'en-tête
// « Authorization: Bearer <jeton> », d'un compte qui existe encore et n'est pas suspendu,
// et accroche l'utilisateur à la requête.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(contexte: ExecutionContext) {
    const requete = contexte.switchToHttp().getRequest<RequeteAuthentifiee>();
    const [type, jeton] = requete.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !jeton) {
      throw new UnauthorizedException('Connexion requise');
    }

    let contenu: UtilisateurJwt;
    try {
      // verifyAsync contrôle la signature et la date d'expiration.
      contenu = await this.jwt.verifyAsync<UtilisateurJwt>(jeton);
    } catch {
      throw new UnauthorizedException('Session expirée, reconnecte-toi');
    }

    // Un jeton reste valide jusqu'à son expiration, même si le compte a été supprimé ou
    // suspendu entre-temps : on vérifie donc le compte en base à chaque requête.
    const compte = await this.prisma.utilisateur.findUnique({
      where: { id: contenu.sub },
      select: { role: true, statut: true },
    });
    if (!compte || compte.statut !== 'ACTIF') {
      throw new UnauthorizedException('Ce compte n’existe plus, reconnecte-toi');
    }
    // Le rôle vient de la base, pas du jeton : un compte nommé administrateur
    // n'a pas besoin de se reconnecter.
    requete.utilisateur = { sub: contenu.sub, role: compte.role };
    return true;
  }
}
