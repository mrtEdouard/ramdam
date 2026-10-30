import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';
import { useEcranLarge } from '@/hooks/use-ecran-large';

type Props = {
  titre: string;
  description: string;
  icone: LucideIcon;
  choisie: boolean;
  onPress: () => void;
};

// Bouton radio en forme de carte : un seul choix possible dans le groupe.
export function CarteChoix({ titre, description, icone: Icone, choisie, onPress }: Props) {
  const ecranLarge = useEcranLarge();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: choisie }}
      accessibilityLabel={`${titre}, ${description}`}
      style={[styles.carte, ecranLarge && styles.carteCompacte, choisie && styles.choisie]}
    >
      <Icone size={22} color={couleurs.encre} strokeWidth={1.75} />
      {/* Sur grand écran, l'icône passe à gauche du texte pour gagner de la hauteur. */}
      <View style={ecranLarge && styles.texteCompact}>
        <Text style={[styles.titre, ecranLarge && styles.titreCompact]}>{titre}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    flex: 1,
    gap: 4,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.fond,
  },
  choisie: {
    borderColor: couleurs.encre,
    borderWidth: 2,
    padding: 13.5,
    backgroundColor: couleurs.surface,
  },
  carteCompacte: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  texteCompact: { flex: 1 },
  titreCompact: { marginTop: 0 },
  titre: { marginTop: 8, fontFamily: polices.texteGras, fontSize: 16, color: couleurs.encre },
  description: { fontFamily: polices.texte, fontSize: 13, lineHeight: 18, color: couleurs.encre2 },
});
