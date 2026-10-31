import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  creerFicheSchema,
  filtresFichesSchema,
  modifierFicheSchema,
  type CreerFicheDto,
  type FiltresFiches,
  type ModifierFicheDto,
} from '@ramdam/shared';
import { JwtAuthGuard, type UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { UtilisateurConnecte } from '../auth/utilisateur-connecte.decorator.js';
import { ZodValidationPipe } from '../commun/zod-validation.pipe.js';
import { FichesService } from './fiches.service.js';

// Toutes les routes des fiches demandent d'être connecté.
@UseGuards(JwtAuthGuard)
@Controller('fiches')
export class FichesController {
  constructor(private readonly fichesService: FichesService) {}

  @Get()
  lister(@Query(new ZodValidationPipe(filtresFichesSchema)) filtres: FiltresFiches) {
    return this.fichesService.lister(filtres);
  }

  // Les routes au chemin fixe sont déclarées avant :id, sinon « a-la-une » serait pris pour un identifiant.
  @Get('a-la-une')
  aLaUne() {
    return this.fichesService.aLaUne();
  }

  @Get('miennes')
  miennes(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.fichesService.miennes(utilisateur);
  }

  // ParseUUIDPipe refuse (400) un identifiant qui n'a pas le format d'un UUID, avant toute requête SQL.
  @Get(':id')
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.detail(id, utilisateur);
  }

  @Post()
  creer(
    @Body(new ZodValidationPipe(creerFicheSchema)) dto: CreerFicheDto,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.creer(dto, utilisateur);
  }

  @Patch(':id')
  modifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(modifierFicheSchema)) dto: ModifierFicheDto,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.modifier(id, dto, utilisateur);
  }

  @Delete(':id')
  @HttpCode(204)
  supprimer(
    @Param('id', ParseUUIDPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.supprimer(id, utilisateur);
  }
}
