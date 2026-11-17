import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

type Props = {
  titre: string;
  onPress: () => void;
  chargement?: boolean;
  // principal : action importante (corail) ; secondaire : action de second rang ;
  // danger : action destructrice (suppression).
  variante?: 'principal' | 'secondaire' | 'danger';
};

export function Bouton({ titre, onPress, chargement = false, variante = 'principal' }: Props) {
  const couleurTexte =
    variante === 'principal'
      ? couleurs.surface
      : variante === 'danger'
        ? couleurs.erreur
        : couleurs.encre;

  return (
    <Pressable
      onPress={onPress}
      disabled={chargement}
      accessibilityRole="button"
      accessibilityState={{ busy: chargement, disabled: chargement }}
      style={({ pressed }) => [styles.bouton, styles[variante], pressed && styles.appuye]}
    >
      {chargement ? (
        <ActivityIndicator color={couleurTexte} accessibilityLabel="Envoi en cours" />
      ) : (
        <Text
          style={[
            styles.titre,
            variante !== 'principal' && styles.titreSecondaire,
            { color: couleurTexte },
          ]}
        >
          {titre}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  principal: { backgroundColor: couleurs.corail },
  secondaire: { borderWidth: 1.5, borderColor: couleurs.trait, backgroundColor: couleurs.surface },
  danger: { borderWidth: 1.5, borderColor: couleurs.erreurDoux, backgroundColor: couleurs.surface },
  appuye: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  // 19 px en gras compte comme « grand texte » pour le RGAA : le contraste blanc sur corail (3,1:1) est suffisant.
  titre: { fontFamily: polices.texteGras, fontSize: 19 },
  titreSecondaire: { fontSize: 17 },
});
