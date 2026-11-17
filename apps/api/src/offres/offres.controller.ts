import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  filtresOffresSchema,
  offreSchema,
  type FiltresOffres,
  type OffreDto,
} from '@ramdam/shared';
import { JwtAuthGuard, type UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { UtilisateurConnecte } from '../auth/utilisateur-connecte.decorator.js';
import { IdentifiantPipe } from '../commun/identifiant.pipe.js';
import { Roles, RolesGuard } from '../commun/roles.guard.js';
import { ZodValidationPipe } from '../commun/zod-validation.pipe.js';
import { OffresService } from './offres.service.js';

// Lire les offres : tout utilisateur connecté.
// Publier, modifier, clôturer, supprimer : @Roles('DIRECTEUR') (RG-15) ; le service vérifie
// en plus que l'offre appartient bien au Directeur connecté.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('offres')
export class OffresController {
  constructor(private readonly offresService: OffresService) {}

  @Get()
  lister(@Query(new ZodValidationPipe(filtresOffresSchema)) filtres: FiltresOffres) {
    return this.offresService.lister(filtres);
  }

  // Déclarée avant :id, sinon « miennes » serait pris pour un identifiant.
  @Get('miennes')
  @Roles('DIRECTEUR')
  miennes(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.offresService.miennes(utilisateur);
  }

  @Get(':id')
  detail(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.offresService.detail(id, utilisateur);
  }

  @Post()
  @Roles('DIRECTEUR')
  creer(
    @Body(new ZodValidationPipe(offreSchema)) dto: OffreDto,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.offresService.creer(dto, utilisateur);
  }

  // PUT : le formulaire renvoie toujours l'offre complète.
  @Put(':id')
  @Roles('DIRECTEUR')
  modifier(
    @Param('id', IdentifiantPipe) id: string,
    @Body(new ZodValidationPipe(offreSchema)) dto: OffreDto,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.offresService.modifier(id, dto, utilisateur);
  }

  // Clôturer (PUT) et rouvrir (DELETE), comme pour « j'aime » : répéter ne change rien.
  @Put(':id/cloture')
  @Roles('DIRECTEUR')
  cloturer(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.offresService.changerStatut(id, 'CLOTUREE', utilisateur);
  }

  @Delete(':id/cloture')
  @Roles('DIRECTEUR')
  rouvrir(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.offresService.changerStatut(id, 'OUVERTE', utilisateur);
  }

  @Delete(':id')
  @Roles('DIRECTEUR')
  @HttpCode(204)
  supprimer(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.offresService.supprimer(id, utilisateur);
  }
}
