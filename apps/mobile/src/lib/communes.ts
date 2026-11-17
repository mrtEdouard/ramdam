import type { Region } from '@ramdam/shared';

// Recherche de communes avec l'API Géo de l'État (geo.api.gouv.fr) : gratuite, sans clé,
// données officielles de l'INSEE. Elle sert seulement à proposer des villes pendant la saisie :
// on peut toujours écrire une ville qu'elle ne connaît pas.

// Code INSEE de chaque région de métropole, pour ne proposer que les villes de la région choisie.
const codesRegion: Partial<Record<Region, string>> = {
  'Auvergne-Rhône-Alpes': '84',
  'Bourgogne-Franche-Comté': '27',
  Bretagne: '53',
  'Centre-Val de Loire': '24',
  Corse: '94',
  'Grand Est': '44',
  'Hauts-de-France': '32',
  'Île-de-France': '11',
  Normandie: '28',
  'Nouvelle-Aquitaine': '75',
  Occitanie: '76',
  'Pays de la Loire': '52',
  'Provence-Alpes-Côte d’Azur': '93',
  // Outre-mer : plusieurs régions, on cherche dans toute la France.
};

export type Commune = { nom: string; codePostal: string };

export async function chercherCommunes(
  texte: string,
  region: Region | undefined,
  signal: AbortSignal,
): Promise<Commune[]> {
  const parametres = new URLSearchParams({
    nom: texte,
    fields: 'nom,codesPostaux',
    boost: 'population', // les grandes villes d'abord : « Mon » → Montpellier avant Monze
    limit: '5',
  });
  const code = region && codesRegion[region];
  if (code) {
    parametres.set('codeRegion', code);
  }
  const reponse = await fetch(`https://geo.api.gouv.fr/communes?${parametres}`, { signal });
  if (!reponse.ok) {
    return [];
  }
  const communes: { nom: string; codesPostaux: string[] }[] = await reponse.json();
  return communes.map((c) => ({ nom: c.nom, codePostal: c.codesPostaux[0] ?? '' }));
}
