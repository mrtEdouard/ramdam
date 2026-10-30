// Charte graphique de Ramdam, reprise des maquettes (docs/maquettes).
export const couleurs = {
  corail: '#FF5A3C',
  corailDoux: '#FFEDE8',
  encre: '#1C1A33',
  encre2: '#57556B',
  encre3: '#8C8A9E',
  fond: '#FAF8F5',
  surface: '#FFFFFF',
  trait: '#ECE8E1',
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

export const espace = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
