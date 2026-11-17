import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

// Vérifie qu'un identifiant de l'adresse a la forme d'un UUID (8-4-4-4-12 caractères hexadécimaux)
// avant toute requête SQL. ParseUUIDPipe de Nest exige en plus un numéro de version,
// ce que n'ont pas les identifiants lisibles du jeu d'essai (10000000-0000-…).
const identifiantSchema = z.guid();

export class IdentifiantPipe implements PipeTransform {
  transform(valeur: unknown) {
    const resultat = identifiantSchema.safeParse(valeur);
    if (!resultat.success) {
      throw new BadRequestException('Identifiant invalide');
    }
    return resultat.data;
  }
}
