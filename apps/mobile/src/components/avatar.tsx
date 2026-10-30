import { StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

// Pastille avec les deux premières lettres du pseudo, en attendant les photos de profil.
export function Avatar({ pseudo, taille = 28 }: { pseudo: string; taille?: number }) {
  const initiales = pseudo
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={[styles.rond, { width: taille, height: taille, borderRadius: taille / 2 }]}
      aria-hidden
    >
      <Text style={[styles.texte, { fontSize: taille * 0.38 }]}>{initiales}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rond: { alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.corailDoux },
  texte: { fontFamily: polices.texteGras, color: couleurs.encre },
});
