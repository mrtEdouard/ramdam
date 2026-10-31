import type { ImageSource } from 'expo-image';
import type { FicheResume, TypeFiche } from '@ramdam/shared';

// Photo par défaut selon le type d'activité, tant que l'envoi de photos n'existe pas.
// Les photos viennent de Wikimedia Commons (crédits dans assets/images/photos/CREDITS.md).
const photosParType: Record<TypeFiche, ImageSource> = {
  VEILLEE: require('@/assets/images/photos/veillee.jpg'),
  GRAND_JEU: require('@/assets/images/photos/foret.jpg'),
  JEU: require('@/assets/images/photos/nature.jpg'),
  MANUEL: require('@/assets/images/photos/fresque.jpg'),
  SPORTIF: require('@/assets/images/photos/relais.jpg'),
  AUTRE: require('@/assets/images/photos/theatre.jpg'),
};

export function imageDeFiche(fiche: Pick<FicheResume, 'type' | 'imageUrl'>): ImageSource {
  return fiche.imageUrl ? { uri: fiche.imageUrl } : photosParType[fiche.type];
}
