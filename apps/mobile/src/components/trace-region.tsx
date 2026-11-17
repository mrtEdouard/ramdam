import { Path } from 'react-native-svg';
import { couleurs } from '@/constants/theme';

export type PropsTrace = {
  nom: string;
  trace: string;
  choisie: boolean;
  choisir: () => void;
};

// Une région de la carte, sur téléphone : un tracé SVG qu'on touche.
// (Sur le web, c'est trace-region.web.tsx qui est utilisé.)
export function TraceRegion({ nom, trace, choisie, choisir }: PropsTrace) {
  return (
    <Path
      d={trace}
      fill={choisie ? couleurs.corail : couleurs.surface}
      stroke={couleurs.encre2}
      strokeWidth={1}
      strokeLinejoin="round"
      onPress={choisir}
      accessibilityLabel={nom}
    />
  );
}
