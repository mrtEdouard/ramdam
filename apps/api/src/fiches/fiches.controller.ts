import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { IdentifiantPipe } from '../commun/identifiant.pipe.js';
import { ZodValidationPipe } from '../commun/zod-validation.pipe.js';
import { fichierImage, TAILLE_MAX_IMAGE } from '../images/fichier-image.pipe.js';
import { FichesService } from './fiches.service.js';
import { ReactionsService } from './reactions.service.js';

// Toutes les routes des fiches demandent d'être connecté.
@UseGuards(JwtAuthGuard)
@Controller('fiches')
export class FichesController {
  constructor(
    private readonly fichesService: FichesService,
    private readonly reactionsService: ReactionsService,
  ) {}

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

  // Les fiches des autres gardées dans sa Malle.
  @Get('gardees')
  gardees(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.reactionsService.malle(utilisateur);
  }

  // IdentifiantPipe refuse (400) un identifiant qui n'a pas le format d'un UUID, avant toute requête SQL.
  @Get(':id')
  detail(
    @Param('id', IdentifiantPipe) id: string,
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
    @Param('id', IdentifiantPipe) id: string,
    @Body(new ZodValidationPipe(modifierFicheSchema)) dto: ModifierFicheDto,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.modifier(id, dto, utilisateur);
  }

  @Delete(':id')
  @HttpCode(204)
  supprimer(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.supprimer(id, utilisateur);
  }

  // ---------- Photos (envoyées en multipart/form-data, champ « image ») ----------
  // FileInterceptor lit le fichier en mémoire et coupe l'envoi au-delà de la taille maximale.

  @Put(':id/couverture')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: TAILLE_MAX_IMAGE } }))
  changerCouverture(
    @Param('id', IdentifiantPipe) id: string,
    @UploadedFile(fichierImage) fichier: Express.Multer.File,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.changerCouverture(id, fichier.buffer, utilisateur);
  }

  @Delete(':id/couverture')
  retirerCouverture(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.retirerCouverture(id, utilisateur);
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: TAILLE_MAX_IMAGE } }))
  ajouterPhoto(
    @Param('id', IdentifiantPipe) id: string,
    @UploadedFile(fichierImage) fichier: Express.Multer.File,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.ajouterPhoto(id, fichier.buffer, utilisateur);
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(204)
  retirerPhoto(
    @Param('id', IdentifiantPipe) id: string,
    @Param('photoId', IdentifiantPipe) photoId: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.fichesService.retirerPhoto(id, photoId, utilisateur);
  }

  // ---------- « J'aime » et Malle ----------
  // PUT pour ajouter, DELETE pour retirer : la même requête répétée donne le même résultat.

  @Put(':id/aime')
  aimer(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.reactionsService.aimer(id, utilisateur);
  }

  @Delete(':id/aime')
  retirerAime(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.reactionsService.retirerAime(id, utilisateur);
  }

  @Put(':id/malle')
  garder(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.reactionsService.garder(id, utilisateur);
  }

  @Delete(':id/malle')
  retirerDeLaMalle(
    @Param('id', IdentifiantPipe) id: string,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.reactionsService.retirerDeLaMalle(id, utilisateur);
  }
}
