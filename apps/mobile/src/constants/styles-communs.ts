import { StyleSheet } from 'react-native';
import { couleurs, polices } from './theme';

// Styles de texte partagés par les écrans d'authentification.
export const texte = StyleSheet.create({
  titre: {
    fontFamily: polices.titre,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    color: couleurs.encre,
  },
  intro: { fontFamily: polices.texte, fontSize: 16, lineHeight: 23, color: couleurs.encre2 },
  courant: { fontFamily: polices.texte, fontSize: 15, lineHeight: 22, color: couleurs.encre2 },
  lien: {
    fontFamily: polices.texteGras,
    color: couleurs.encre,
    textDecorationLine: 'underline',
  },
});
