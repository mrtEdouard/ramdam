import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  connexionSchema,
  inscriptionSchema,
  type ConnexionDto,
  type InscriptionDto,
} from '@ramdam/shared';
import { ZodValidationPipe } from '../commun/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';

// Limite le nombre d'essais par adresse IP pour freiner les attaques par force brute.
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('inscription')
  inscrire(@Body(new ZodValidationPipe(inscriptionSchema)) dto: InscriptionDto) {
    return this.authService.inscrire(dto);
  }

  @Post('connexion')
  @HttpCode(200)
  connecter(@Body(new ZodValidationPipe(connexionSchema)) dto: ConnexionDto) {
    return this.authService.connecter(dto);
  }
}
