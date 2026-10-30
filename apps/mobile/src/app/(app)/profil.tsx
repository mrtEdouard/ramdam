import { LogOut } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { couleurs, polices } from '@/constants/theme';
import { useSession } from '@/session/session-context';

// Profil provisoire : le niveau, les badges et les fiches publiées arriveront avec la gamification.
export default function Profil() {
  const { session, deconnecter } = useSession();
  if (!session) {
    return null;
  }
  const { pseudo, role, xp } = session.utilisateur;

  return (
    <View style={styles.page}>
      <View style={styles.identite}>
        <Avatar pseudo={pseudo} taille={72} />
        <Text style={styles.pseudo}>{pseudo}</Text>
        <Text style={styles.details}>
          Compte {role === 'DIRECTEUR' ? 'Directeur' : 'Animateur'} · {xp} XP
        </Text>
      </View>

      <Pressable
        onPress={deconnecter}
        style={({ pressed }) => [styles.deconnexion, pressed && styles.appuye]}
        accessibilityRole="button"
      >
        <LogOut size={20} color={couleurs.erreur} strokeWidth={2} />
        <Text style={styles.texteDeconnexion}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, gap: 28, padding: 20, backgroundColor: couleurs.fond },
  identite: { alignItems: 'center', gap: 6, paddingTop: 12 },
  pseudo: {
    marginTop: 8,
    fontFamily: polices.titre,
    fontSize: 26,
    letterSpacing: -0.6,
    color: couleurs.encre,
  },
  details: { fontFamily: polices.texte, fontSize: 15, color: couleurs.encre2 },
  deconnexion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  appuye: { opacity: 0.85 },
  texteDeconnexion: { fontFamily: polices.texteGras, fontSize: 16, color: couleurs.erreur },
});
