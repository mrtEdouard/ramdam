// Comprend ce qu'on tape dans la recherche de l'accueil : « veillée 8 ans » cherche le mot
// « veillée » dans les activités pour les 8 ans. L'âge est reconnu par « 8 ans » ou « 8 an ».
export function lireRecherche(texte: string): { mots: string; age?: number } {
  const trouve = texte.match(/\b(\d{1,2})\s*ans?\b/i);
  const age = trouve ? Number(trouve[1]) : undefined;
  // Les fiches visent les 3 à 17 ans (RG-07) : un autre nombre reste un simple mot cherché.
  if (age === undefined || age < 3 || age > 17) {
    return { mots: texte.trim() };
  }
  return { mots: texte.replace(trouve![0], ' ').replace(/\s+/g, ' ').trim(), age };
}
