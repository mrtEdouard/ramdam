// Génère apps/mobile/src/constants/carte-regions.ts : les contours des 13 régions de métropole
// en tracés SVG, pour la carte cliquable du formulaire et des filtres d'offres.
//
// Source : france-geojson (github.com/gregoiredavid/france-geojson), fichier
// regions-version-simplifiee.geojson, tiré d'Admin Express de l'IGN (Licence ouverte Etalab).
//
// Usage : node scripts/generer-carte-regions.mjs chemin/vers/regions-version-simplifiee.geojson
//         puis npx prettier --write apps/mobile/src/constants/carte-regions.ts
import { readFileSync, writeFileSync } from 'node:fs';

// Le code INSEE de chaque région, vers le nom utilisé dans l'app (packages/shared/src/offres.ts).
const NOMS = {
  11: 'Île-de-France',
  24: 'Centre-Val de Loire',
  27: 'Bourgogne-Franche-Comté',
  28: 'Normandie',
  32: 'Hauts-de-France',
  44: 'Grand Est',
  52: 'Pays de la Loire',
  53: 'Bretagne',
  75: 'Nouvelle-Aquitaine',
  76: 'Occitanie',
  84: 'Auvergne-Rhône-Alpes',
  93: 'Provence-Alpes-Côte d’Azur',
  94: 'Corse',
};

const LARGEUR = 400; // largeur de la carte en unités SVG
const TOLERANCE = 0.6; // simplification : on retire les points qui s'écartent de moins de 0,6 unité

const geojson = JSON.parse(readFileSync(process.argv[2], 'utf8'));

// Projection simple : à la latitude de la France, un degré de longitude est plus court
// qu'un degré de latitude (facteur cos 46,5°). L'axe vertical est inversé (le nord en haut).
const COS = Math.cos((46.5 * Math.PI) / 180);
const projeter = ([lon, lat]) => [lon * COS, -lat];

const polygones = (geometrie) =>
  geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates;

// Cadre englobant de toute la métropole, pour mettre la carte à l'échelle.
const points = geojson.features.flatMap((f) =>
  polygones(f.geometry).flatMap((p) => p[0].map(projeter)),
);
const minX = Math.min(...points.map((p) => p[0]));
const maxX = Math.max(...points.map((p) => p[0]));
const minY = Math.min(...points.map((p) => p[1]));
const maxY = Math.max(...points.map((p) => p[1]));
const echelle = LARGEUR / (maxX - minX);
const HAUTEUR = Math.round((maxY - minY) * echelle);
const versCarte = ([x, y]) => [(x - minX) * echelle, (y - minY) * echelle];

// Douglas-Peucker : garde la forme d'un contour avec beaucoup moins de points.
function simplifier(ligne) {
  if (ligne.length < 3) return ligne;
  const [ax, ay] = ligne[0];
  const [bx, by] = ligne[ligne.length - 1];
  const longueur = Math.hypot(bx - ax, by - ay) || 1;
  let plusLoin = 0;
  let index = 0;
  for (let i = 1; i < ligne.length - 1; i++) {
    const [px, py] = ligne[i];
    const distance = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / longueur;
    if (distance > plusLoin) {
      plusLoin = distance;
      index = i;
    }
  }
  if (plusLoin < TOLERANCE) return [ligne[0], ligne[ligne.length - 1]];
  return [...simplifier(ligne.slice(0, index + 1)).slice(0, -1), ...simplifier(ligne.slice(index))];
}

// Un contour fermé commence et finit au même point : on le coupe en deux moitiés,
// sinon Douglas-Peucker n'aurait pas de segment de départ.
function simplifierContour(contour) {
  const milieu = Math.floor(contour.length / 2);
  return [
    ...simplifier(contour.slice(0, milieu + 1)).slice(0, -1),
    ...simplifier(contour.slice(milieu)),
  ];
}

const arrondi = (n) => Math.round(n * 10) / 10;

const regions = geojson.features.map((f) => {
  const contours = polygones(f.geometry)
    .map((p) => simplifierContour(p[0].map(projeter).map(versCarte)))
    .filter((c) => c.length >= 4); // on oublie les îlots réduits à un trait
  const trace = contours
    .map((c) => 'M' + c.map(([x, y]) => `${arrondi(x)} ${arrondi(y)}`).join('L') + 'Z')
    .join('');
  // Point où écrire le nom : le centre du plus grand contour.
  const principal = contours.reduce((a, b) => (b.length > a.length ? b : a));
  const centre = principal
    .reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
    .map((s) => arrondi(s / principal.length));
  return { nom: NOMS[f.properties.code], trace, centre };
});

const sortie = `// Fichier généré par scripts/generer-carte-regions.mjs : ne pas modifier à la main.
// Contours : Admin Express (IGN), via france-geojson, Licence ouverte Etalab.
import type { Region } from '@ramdam/shared';

export const LARGEUR_CARTE = ${LARGEUR};
export const HAUTEUR_CARTE = ${HAUTEUR};

export const regionsCarte: { nom: Region; trace: string; centre: [number, number] }[] = ${JSON.stringify(regions, null, 2)};
`;
writeFileSync('apps/mobile/src/constants/carte-regions.ts', sortie);
console.log(
  `${regions.length} régions, ${LARGEUR}×${HAUTEUR}, ${Math.round(sortie.length / 1024)} Ko`,
);
