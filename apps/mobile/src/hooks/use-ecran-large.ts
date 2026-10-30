import { useWindowDimensions } from 'react-native';

// À partir de cette largeur (tablette paysage, ordinateur), les écrans passent en mise en page large.
const LARGEUR_MINIMALE = 900;

export function useEcranLarge() {
  return useWindowDimensions().width >= LARGEUR_MINIMALE;
}
