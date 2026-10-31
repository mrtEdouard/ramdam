import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { UtilisateurConnecte } from '../auth/utilisateur-connecte.decorator.js';
import { ProfilService } from './profil.service.js';

// Toutes les routes du profil demandent d'être connecté.
@UseGuards(JwtAuthGuard)
@Controller('profils')
export class ProfilController {
  constructor(private readonly profilService: ProfilService) {}

  // Déclarée avant :pseudo, sinon « moi » serait pris pour un pseudo.
  @Get('moi')
  monProfil(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.profilService.trouver({ id: utilisateur.sub });
  }

  @Get(':pseudo')
  profilDe(@Param('pseudo') pseudo: string) {
    return this.profilService.trouver({ pseudo });
  }
}
