import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

// Valide le corps d'une requête avec un schéma Zod avant qu'il n'arrive dans le contrôleur.
// Si les données sont invalides, la requête s'arrête ici avec une erreur 400 qui liste chaque champ en faute.
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(valeur: unknown) {
    const resultat = this.schema.safeParse(valeur);
    if (!resultat.success) {
      throw new BadRequestException({
        message: 'Données invalides',
        erreurs: resultat.error.issues.map((issue) => ({
          champ: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    // On renvoie les données nettoyées par Zod : les champs inconnus sont retirés.
    return resultat.data;
  }
}
