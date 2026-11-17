import type { ImagePickerAsset } from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

// Côté le plus long d'une photo envoyée depuis l'app : l'API la réduit ensuite à 1 600 px.
const COTE_MAX = 2000;
// Même limite que l'API (apps/api/src/images/fichier-image.pipe.ts).
const TAILLE_MAX = 15 * 1024 * 1024;

export class FormatPhotoNonLu extends Error {}

// Prépare la photo choisie avant l'envoi. Renvoie l'adresse locale de la photo à envoyer.
export async function preparerPhoto(photo: ImagePickerAsset): Promise<string> {
  if (Platform.OS === 'web') {
    // Sur le site, on envoie la photo d'origine, sans la retoucher dans le navigateur :
    // - un navigateur de téléphone refuse de redessiner une photo de 50 mégapixels ;
    // - il ne sait pas lire le HEIC, le format de beaucoup de téléphones.
    // C'est le serveur qui la lit (HEIC compris), la réduit et la convertit en WebP.
    const taille = photo.file?.size ?? photo.fileSize ?? 0;
    if (taille > TAILLE_MAX) {
      throw new FormatPhotoNonLu('Cette photo est trop lourde : 15 Mo maximum.');
    }
    return photo.uri;
  }

  // Dans l'app, on convertit en JPEG et on réduit avant l'envoi : l'envoi est plus léger,
  // ce qui compte sur une connexion mobile.
  try {
    const contexte = ImageManipulator.manipulate(photo.uri);
    if (Math.max(photo.width, photo.height) > COTE_MAX) {
      contexte.resize(photo.width >= photo.height ? { width: COTE_MAX } : { height: COTE_MAX });
    }
    const image = await contexte.renderAsync();
    const resultat = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
    return resultat.uri;
  } catch {
    throw new FormatPhotoNonLu('Cette photo n’a pas pu être lue. Essaie avec une autre photo.');
  }
}
