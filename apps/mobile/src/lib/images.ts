import type { ImageSource } from 'expo-image';
import type { FicheResume, TypeFiche } from '@ramdam/shared';
import { URL_API } from './api';

// Photo par défaut selon le type d'activité, quand l'auteur n'a pas mis de couverture.
// Les photos viennent de Wikimedia Commons (crédits dans assets/images/photos/CREDITS.md).
const photosParType: Record<TypeFiche, ImageSource> = {
  VEILLEE: require('@/assets/images/photos/veillee.jpg'),
  GRAND_JEU: require('@/assets/images/photos/foret.jpg'),
  JEU: require('@/assets/images/photos/nature.jpg'),
  MANUEL: require('@/assets/images/photos/fresque.jpg'),
  SPORTIF: require('@/assets/images/photos/relais.jpg'),
  AUTRE: require('@/assets/images/photos/theatre.jpg'),
};

// L'API renvoie une adresse relative (/images/….webp) : on la complète avec l'adresse du serveur.
export function adresseImage(url: string): ImageSource {
  return { uri: url.startsWith('/') ? `${URL_API}${url}` : url };
}

export function imageDeFiche(fiche: Pick<FicheResume, 'type' | 'imageUrl'>): ImageSource {
  return fiche.imageUrl ? adresseImage(fiche.imageUrl) : photosParType[fiche.type];
}
