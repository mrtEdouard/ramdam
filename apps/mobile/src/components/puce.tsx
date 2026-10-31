import { Pressable, StyleSheet, Text } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

// Bouton-filtre en forme de pastille : foncé quand il est choisi.
export function Puce({
  libelle,
  choisie,
  onPress,
}: {
  libelle: string;
  choisie: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.puce, choisie && styles.choisie]}
      accessibilityRole="button"
      accessibilityState={{ selected: choisie }}
    >
      <Text style={[styles.texte, choisie && styles.texteChoisi]}>{libelle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  puce: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  choisie: { borderColor: couleurs.encre, backgroundColor: couleurs.encre },
  texte: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.encre },
  texteChoisi: { color: couleurs.surface },
});
