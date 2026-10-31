import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import sharp from 'sharp';

// Préfixe des adresses publiques des images : https://api.../images/<nom>.webp
export const PREFIXE_IMAGES = '/images/';

// Enregistre les photos envoyées par les utilisateurs dans un dossier du serveur.
@Injectable()
export class StockageImages {
  readonly dossier: string;

  constructor(config: ConfigService) {
    this.dossier = resolve(config.get<string>('DOSSIER_IMAGES') ?? 'televersements');
    mkdirSync(this.dossier, { recursive: true });
  }

  async enregistrer(contenu: Buffer): Promise<string> {
    let image: Buffer;
    try {
      // sharp relit le fichier comme une image : un fichier qui n'en est pas une est refusé,
      // même s'il porte une extension .jpg. Puis il :
      // - redresse la photo selon l'orientation de l'appareil (rotate) ;
      // - la réduit à 1 600 px au plus, ce qui suffit pour un écran et allège le stockage ;
      // - la convertit en WebP, plus léger que le JPEG ;
      // - retire les métadonnées EXIF, dont la position GPS de la prise de vue (RGPD).
      image = await sharp(contenu)
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      throw new BadRequestException('Ce fichier n’est pas une image valide');
    }
    // Nom aléatoire : on ne garde jamais le nom choisi par l'utilisateur.
    const nom = `${randomUUID()}.webp`;
    await writeFile(join(this.dossier, nom), image);
    return `${PREFIXE_IMAGES}${nom}`;
  }

  async supprimer(url: string | null) {
    if (!url?.startsWith(PREFIXE_IMAGES)) {
      return;
    }
    // basename empêche de sortir du dossier avec un nom piégé comme « ../../.env ».
    await rm(join(this.dossier, basename(url)), { force: true });
  }
}
