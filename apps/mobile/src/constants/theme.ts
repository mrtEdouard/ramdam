// Charte graphique de Ramdam : l'esprit d'un carnet de colo (papier, encre, tampon),
// plutôt que le duo bleu nuit + corail et les cartes très arrondies des interfaces génériques.
export const couleurs = {
  corail: '#E0452A', // rouge tomate, plus franc ; réservé aux actions principales
  corailDoux: '#F6E1D3',
  sapin: '#2E5E4A', // second ton, pour les types d'activité et les étiquettes
  sapinDoux: '#DDE8E0',
  encre: '#1E1A16', // noir chaud, comme une encre de stylo
  encre2: '#5B544C',
  encre3: '#8E867B',
  fond: '#F3EEE4', // papier
  surface: '#FFFCF6',
  trait: '#E0D7C8',
  erreur: '#C8321E',
  erreurDoux: '#FDECEA',
  // Vert assombri pour garder un contraste de 4,5:1 sur le fond (RGAA).
  succes: '#167A5F',
} as const;

// Noms des polices chargées dans app/_layout.tsx.
export const polices = {
  titre: 'BricolageGrotesque_800ExtraBold',
  texte: 'DMSans_400Regular',
  texteMoyen: 'DMSans_500Medium',
  texteGras: 'DMSans_700Bold',
} as const;

// Arrondis volontairement petits : une interface « fait main » n'arrondit pas tout pareil.
export const rayon = { s: 4, m: 8, l: 12 } as const;

export const espace = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
