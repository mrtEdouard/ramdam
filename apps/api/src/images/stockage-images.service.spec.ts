import type { ConfigService } from '@nestjs/config';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { StockageImages } from './stockage-images.service.js';

const { decoderHeic } = vi.hoisted(() => ({ decoderHeic: vi.fn() }));
vi.mock('heic-decode', () => ({ default: decoderHeic }));

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

  it('passe les photos HEIC des téléphones par le décodeur HEIC', async () => {
    // Le décodeur est simulé : il renvoie une image rouge de 2 000 × 1 000 px en RGBA.
    decoderHeic.mockResolvedValue({
      width: 2000,
      height: 1000,
      data: new Uint8ClampedArray(2000 * 1000 * 4).fill(200),
    });
    // Un fichier HEIC commence par 4 octets de taille, puis « ftyp » et la marque « heic ».
    const heic = Buffer.concat([
      Buffer.from([0, 0, 0, 24]),
      Buffer.from('ftypheic'),
      Buffer.alloc(16),
    ]);

    const url = await stockage.enregistrer(heic);

    expect(decoderHeic).toHaveBeenCalledWith({ buffer: heic });
    const infos = await sharp(readFileSync(join(dossier, url.replace('/images/', '')))).metadata();
    expect(infos).toMatchObject({ format: 'webp', width: 1600, height: 800 });
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
