import type { ConfigService } from '@nestjs/config';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { StockageImages } from './stockage-images.service.js';

// Ces tests utilisent un vrai dossier temporaire et la vraie bibliothèque sharp.
const dossier = mkdtempSync(join(tmpdir(), 'ramdam-images-'));
const config = { get: () => dossier } as unknown as ConfigService;
const stockage = new StockageImages(config);

// Une photo JPEG de 3 000 × 2 000 px avec des métadonnées EXIF, comme sortie d'un téléphone.
async function photoDeTelephone() {
  return sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#FF5A3C' } })
    .jpeg()
    .withExif({ IFD0: { Make: 'Téléphone', Copyright: 'Léa' } })
    .toBuffer();
}

describe('StockageImages', () => {
  it('convertit en WebP, réduit à 1 600 px et retire les métadonnées', async () => {
    const url = await stockage.enregistrer(await photoDeTelephone());

    expect(url).toMatch(/^\/images\/[0-9a-f-]{36}\.webp$/);
    const fichier = readFileSync(join(dossier, url.replace('/images/', '')));
    const infos = await sharp(fichier).metadata();
    expect(infos.format).toBe('webp');
    expect(Math.max(infos.width, infos.height)).toBe(1600);
    expect(infos.exif).toBeUndefined();
  });

  it("refuse un fichier qui n'est pas une image, même nommé .jpg", async () => {
    await expect(stockage.enregistrer(Buffer.from('<script>alert(1)</script>'))).rejects.toThrow(
      'Ce fichier n’est pas une image valide',
    );
  });

  it('ne supprime rien en dehors du dossier des images', async () => {
    const secret = join(dossier, '..', 'ramdam-secret-test.txt');
    writeFileSync(secret, 'ne pas effacer');

    await stockage.supprimer('/images/../ramdam-secret-test.txt');

    expect(readFileSync(secret, 'utf8')).toBe('ne pas effacer');
    expect(readdirSync(dossier).length).toBeGreaterThanOrEqual(1);
  });
});
