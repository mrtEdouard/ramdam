import { BadRequestException, ParseFilePipeBuilder } from '@nestjs/common';

// 8 Mo : une photo de téléphone récent tient dedans ; elle sera ensuite réduite par sharp.
export const TAILLE_MAX_IMAGE = 8 * 1024 * 1024;

// Vérifie qu'un fichier a bien été envoyé et qu'il est d'un type image courant.
// Le contenu est contrôlé une seconde fois par sharp, qui ne se fie pas au type annoncé.
export const fichierImage = new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: /^image\/(jpeg|jpg|png|webp)$/,
    skipMagicNumbersValidation: true,
  })
  .addMaxSizeValidator({ maxSize: TAILLE_MAX_IMAGE, message: 'Image trop lourde : 8 Mo maximum' })
  .build({
    exceptionFactory: (erreur) =>
      new BadRequestException(
        erreur.includes('expected type') ? 'Formats acceptés : JPEG, PNG ou WebP' : erreur,
      ),
  });
