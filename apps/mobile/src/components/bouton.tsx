import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

type Props = {
  titre: string;
  onPress: () => void;
  chargement?: boolean;
};

export function Bouton({ titre, onPress, chargement = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={chargement}
      accessibilityRole="button"
      accessibilityState={{ busy: chargement, disabled: chargement }}
      style={({ pressed }) => [styles.bouton, pressed && styles.appuye]}
    >
      {chargement ? (
        <ActivityIndicator color={couleurs.surface} accessibilityLabel="Envoi en cours" />
      ) : (
        <Text style={styles.titre}>{titre}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: couleurs.corail,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  appuye: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  // 19 px en gras compte comme « grand texte » pour le RGAA : le contraste blanc sur corail (3,1:1) est suffisant.
  titre: { fontFamily: polices.texteGras, fontSize: 19, color: couleurs.surface },
});
