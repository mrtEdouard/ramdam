import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

type Props = {
  niveau: number;
  taille?: number;
  verrouille?: boolean;
};

// Sur le web, Skia a besoin de son moteur (canvaskit.wasm, servi depuis public/) avant de dessiner.
// WithSkiaWeb le charge une seule fois, puis importe l'insigne ; en attendant, la place reste réservée.
export function Embleme({ niveau, taille = 160, verrouille = false }: Props) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: (fichier) => `/${fichier}` }}
      getComponent={() => import('./insigne-rang')}
      fallback={<View style={{ width: taille, height: taille }} />}
      componentProps={{ niveau, taille, verrouille }}
    />
  );
}
