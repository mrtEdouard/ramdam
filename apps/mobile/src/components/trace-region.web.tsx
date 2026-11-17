import { couleurs } from '@/constants/theme';
import type { PropsTrace } from './trace-region';

// Une région de la carte, sur le web : un vrai <path> du navigateur.
// - onClick au lieu de onPress : react-native-svg transmettrait au navigateur des gestionnaires
//   de toucher qu'il ne connaît pas (avertissements dans la console) ;
// - role, tabIndex et la touche Entrée : on peut aussi choisir une région au clavier (RGAA).
export function TraceRegion({ nom, trace, choisie, choisir }: PropsTrace) {
  return (
    <path
      d={trace}
      fill={choisie ? couleurs.corail : couleurs.surface}
      stroke={couleurs.encre2}
      strokeWidth={1}
      strokeLinejoin="round"
      onClick={choisir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choisir();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={nom}
      aria-pressed={choisie}
      style={{ cursor: 'pointer', outlineColor: couleurs.encre }}
    />
  );
}
