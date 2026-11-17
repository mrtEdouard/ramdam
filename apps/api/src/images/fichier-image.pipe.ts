import { BadRequestException, ParseFilePipeBuilder } from '@nestjs/common';

// 15 Mo : la photo d'origine d'un appareil récent (50 mégapixels) tient dedans ;
// elle sera ensuite réduite à 1 600 px par sharp.
export const TAILLE_MAX_IMAGE = 15 * 1024 * 1024;

// Vérifie qu'un fichier a bien été envoyé et qu'il est d'un type image courant.
// Le contenu est contrôlé une seconde fois par sharp, qui ne se fie pas au type annoncé.
export const fichierImage = new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: /^image\/(jpeg|jpg|png|webp|heic|heif)$/,
    skipMagicNumbersValidation: true,
  })
  .addMaxSizeValidator({ maxSize: TAILLE_MAX_IMAGE, message: 'Image trop lourde : 15 Mo maximum' })
  .build({
    exceptionFactory: (erreur) =>
      new BadRequestException(
        erreur.includes('expected type') ? 'Formats acceptés : JPEG, PNG, WebP ou HEIC' : erreur,
      ),
  });
