import { CircleAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

// Erreur générale du formulaire (serveur injoignable, compte suspendu...).
export function MessageErreur({ message }: { message: string }) {
  return (
    <View style={styles.boite} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <CircleAlert size={18} color={couleurs.erreur} strokeWidth={2} />
      <Text style={styles.texte}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  boite: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: couleurs.erreurDoux,
  },
  texte: {
    flex: 1,
    fontFamily: polices.texteMoyen,
    fontSize: 14,
    lineHeight: 20,
    color: couleurs.erreur,
  },
});
