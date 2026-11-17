import { Body, Controller, Get, Param, ParseEnumPipe, Post, Put, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  decisionSchema,
  signalementSchema,
  type CibleSignalement,
  type DecisionDto,
  type SignalementDto,
} from '@ramdam/shared';
import { JwtAuthGuard, type UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { UtilisateurConnecte } from '../auth/utilisateur-connecte.decorator.js';
import { IdentifiantPipe } from '../commun/identifiant.pipe.js';
import { Roles, RolesGuard } from '../commun/roles.guard.js';
import { ZodValidationPipe } from '../commun/zod-validation.pipe.js';
import { ModerationService } from './moderation.service.js';

// Signaler : tout utilisateur connecté, 10 signalements par minute au plus (anti-abus).
@UseGuards(JwtAuthGuard)
@Controller('signalements')
export class SignalementsController {
  constructor(private readonly moderation: ModerationService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  signaler(
    @Body(new ZodValidationPipe(signalementSchema)) dto: SignalementDto,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.moderation.signaler(dto, utilisateur);
  }
}

// Modérer : réservé aux administrateurs, sur toutes les routes du contrôleur.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get('signalements')
  enAttente() {
    return this.moderation.enAttente();
  }

  // PUT /moderation/FICHE/<id> { decision: 'MASQUER' | 'IGNORER' }
  @Put(':cible/:cibleId')
  decider(
    @Param(
      'cible',
      new ParseEnumPipe({ FICHE: 'FICHE', COMMENTAIRE: 'COMMENTAIRE', OFFRE: 'OFFRE' }),
    )
    cible: CibleSignalement,
    @Param('cibleId', IdentifiantPipe) cibleId: string,
    @Body(new ZodValidationPipe(decisionSchema)) dto: DecisionDto,
    @UtilisateurConnecte() admin: UtilisateurJwt,
  ) {
    return this.moderation.decider(cible, cibleId, dto, admin);
  }
}
