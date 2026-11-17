import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  modifierProfilSchema,
  supprimerCompteSchema,
  type ModifierProfilDto,
  type SupprimerCompteDto,
} from '@ramdam/shared';
import { JwtAuthGuard, type UtilisateurJwt } from '../auth/jwt-auth.guard.js';
import { UtilisateurConnecte } from '../auth/utilisateur-connecte.decorator.js';
import { ZodValidationPipe } from '../commun/zod-validation.pipe.js';
import { fichierImage, TAILLE_MAX_IMAGE } from '../images/fichier-image.pipe.js';
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

  // Historique privé : l'identifiant vient du jeton, jamais de l'adresse,
  // donc personne ne peut consulter l'historique d'un autre compte.
  @Get('moi/historique-xp')
  monHistoriqueXp(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.profilService.historiqueXp(utilisateur.sub);
  }

  // Modifier son profil : toujours « moi », jamais un pseudo dans l'adresse,
  // donc personne ne peut modifier le profil d'un autre.
  @Put('moi')
  modifier(
    @Body(new ZodValidationPipe(modifierProfilSchema)) dto: ModifierProfilDto,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.profilService.modifier(utilisateur.sub, dto);
  }

  @Put('moi/avatar')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: TAILLE_MAX_IMAGE } }))
  changerAvatar(
    @UploadedFile(fichierImage) fichier: Express.Multer.File,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.profilService.changerAvatar(utilisateur.sub, fichier.buffer);
  }

  @Delete('moi/avatar')
  retirerAvatar(@UtilisateurConnecte() utilisateur: UtilisateurJwt) {
    return this.profilService.retirerAvatar(utilisateur.sub);
  }

  // RGPD : suppression du compte, mot de passe redemandé. 5 essais par minute au plus,
  // pour qu'on ne puisse pas deviner le mot de passe depuis un téléphone resté ouvert.
  // (DELETE avec un corps : le mot de passe ne doit pas apparaître dans l'adresse.)
  @Delete('moi')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(204)
  supprimerCompte(
    @Body(new ZodValidationPipe(supprimerCompteSchema)) dto: SupprimerCompteDto,
    @UtilisateurConnecte() utilisateur: UtilisateurJwt,
  ) {
    return this.profilService.supprimerCompte(utilisateur.sub, dto.motDePasse);
  }

  @Get(':pseudo')
  profilDe(@Param('pseudo') pseudo: string) {
    return this.profilService.trouver({ pseudo });
  }
}
