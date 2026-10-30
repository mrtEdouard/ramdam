import { Link } from 'expo-router';
import { House } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { Logo } from '@/components/logo';
import { PageAVenir } from '@/components/page-a-venir';
import { couleurs } from '@/constants/theme';
import { useSession } from '@/session/session-context';

export default function Accueil() {
  const { session } = useSession();

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      <View style={styles.entete}>
        <Logo />
        <Link href="/profil" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Mon profil" hitSlop={8}>
            <Avatar pseudo={session?.utilisateur.pseudo ?? ''} taille={40} />
          </Pressable>
        </Link>
      </View>
      <PageAVenir
        icone={House}
        titre="Accueil"
        description="Les activités et les offres récemment publiées."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
