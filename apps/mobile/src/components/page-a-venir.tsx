import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

type Props = {
  icone: LucideIcon;
  titre: string;
  description: string;
};

// Page dont le contenu n'est pas encore développé : la navigation fonctionne déjà jusqu'ici.
export function PageAVenir({ icone: Icone, titre, description }: Props) {
  return (
    <View style={styles.page}>
      <View style={styles.pastille}>
        <Icone size={28} color={couleurs.corail} strokeWidth={1.75} />
      </View>
      <Text style={styles.titre} accessibilityRole="header">
        {titre}
      </Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
    backgroundColor: couleurs.fond,
  },
  pastille: {
    width: 64,
    height: 64,
    marginBottom: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.corailDoux,
  },
  titre: {
    fontFamily: polices.titre,
    fontSize: 24,
    letterSpacing: -0.6,
    color: couleurs.encre,
    textAlign: 'center',
  },
  description: {
    maxWidth: 300,
    fontFamily: polices.texte,
    fontSize: 15,
    lineHeight: 22,
    color: couleurs.encre2,
    textAlign: 'center',
  },
});
