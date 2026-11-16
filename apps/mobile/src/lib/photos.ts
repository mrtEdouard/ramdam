import type { ImagePickerAsset } from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Côté le plus long d'une photo envoyée : l'API la réduit ensuite à 1 600 px.
const COTE_MAX = 2000;

export class FormatPhotoNonLu extends Error {}

// Convertit la photo choisie en JPEG, et la réduit si elle est très grande, avant l'envoi.
// Beaucoup de téléphones enregistrent en HEIF/HEIC, un format que l'API (et Chrome) ne lisent pas :
// une fois convertie, la photo s'affiche partout et l'envoi est plus léger.
// Renvoie l'adresse locale de la photo JPEG.
export async function preparerPhoto(photo: ImagePickerAsset): Promise<string> {
  try {
    const contexte = ImageManipulator.manipulate(photo.uri);
    if (Math.max(photo.width, photo.height) > COTE_MAX) {
      contexte.resize(photo.width >= photo.height ? { width: COTE_MAX } : { height: COTE_MAX });
    }
    const image = await contexte.renderAsync();
    const resultat = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
    return resultat.uri;
  } catch {
    // Sur le web, la conversion passe par le navigateur : s'il ne sait pas lire le fichier
    // (HEIC dans Chrome), on ne peut rien en faire.
    throw new FormatPhotoNonLu(
      'Cette photo est dans un format que ton navigateur ne sait pas lire (souvent HEIC). Choisis une photo JPEG ou PNG, ou utilise l’app Ramdam sur ton téléphone.',
    );
  }
}
