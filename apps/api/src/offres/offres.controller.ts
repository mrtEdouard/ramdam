import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { IdentifiantPipe } from '../commun/identifiant.pipe.js';
import { ZodValidationPipe } from '../commun/zod-validation.pipe.js';
import { OffresService } from './offres.service.js';

const nombreSchema = z.coerce.number().int().min(1).max(50).default(20);

@UseGuards(JwtAuthGuard)
@Controller('offres')
export class OffresController {
  constructor(private readonly offresService: OffresService) {}

  @Get()
  lister(@Query('nombre', new ZodValidationPipe(nombreSchema)) nombre: number) {
    return this.offresService.lister(nombre);
  }

  @Get(':id')
  detail(@Param('id', IdentifiantPipe) id: string) {
    return this.offresService.detail(id);
  }
}
