import InsigneRang from './insigne-rang';

type Props = {
  niveau: number;
  taille?: number;
  verrouille?: boolean;
};

// Sur téléphone, Skia est intégré à l'app : l'insigne s'affiche directement.
// Sur le web, c'est embleme.web.tsx qui est utilisé à la place de ce fichier.
export function Embleme({ niveau, taille = 160, verrouille = false }: Props) {
  return <InsigneRang niveau={niveau} taille={taille} verrouille={verrouille} />;
}
