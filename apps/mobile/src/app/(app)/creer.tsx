import { router } from 'expo-router';
import { ChevronRight, Megaphone, PencilLine, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

// Choix proposé aux Directeurs quand ils appuient sur « + » : créer une fiche ou publier une offre.
export default function Creer() {
  return (
    <View style={styles.page}>
      <Choix
        icone={PencilLine}
        titre="Créer une fiche"
        description="Partager une activité avec les autres animateurs"
        onPress={() => router.replace('/fiches/nouvelle')}
      />
      <Choix
        icone={Megaphone}
        titre="Publier une offre"
        description="Recruter des animateurs pour ta structure"
        onPress={() => router.replace('/offres/nouvelle')}
      />
    </View>
  );
}

type PropsChoix = {
  icone: LucideIcon;
  titre: string;
  description: string;
  onPress: () => void;
};

function Choix({ icone: Icone, titre, description, onPress }: PropsChoix) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.choix, pressed && styles.appuye]}
      accessibilityRole="button"
      accessibilityLabel={`${titre}, ${description}`}
    >
      <View style={styles.pastille}>
        <Icone size={22} color={couleurs.corail} strokeWidth={2} />
      </View>
      <View style={styles.textes}>
        <Text style={styles.titre}>{titre}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <ChevronRight size={20} color={couleurs.encre2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, gap: 12, padding: 20, backgroundColor: couleurs.fond },
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  appuye: { opacity: 0.85 },
  pastille: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.corailDoux,
  },
  textes: { flex: 1, gap: 2 },
  titre: { fontFamily: polices.texteGras, fontSize: 16, color: couleurs.encre },
  description: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
});
