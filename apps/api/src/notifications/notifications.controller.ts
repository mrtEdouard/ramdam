import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { UtilisateurConnecte } from '../auth/utilisateur-connecte.decorator.js';
import { NotificationsService } from './notifications.service.js';

// Chacun ne voit que ses propres notifications : l'identifiant vient du jeton, jamais de l'adresse.
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  lister(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.notificationsService.lister(utilisateur);
  }

  @Get('non-lues')
  nombreNonLues(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.notificationsService.nombreNonLues(utilisateur);
  }

  @Post('lues')
  @HttpCode(204)
  marquerToutesLues(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.notificationsService.marquerToutesLues(utilisateur);
  }
}
