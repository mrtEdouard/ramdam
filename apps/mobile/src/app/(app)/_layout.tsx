import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BarreOnglets } from '@/components/barre-onglets';
import { couleurs, polices } from '@/constants/theme';
import { useSession } from '@/session/session-context';

// Écrans réservés aux personnes connectées : les onglets, puis les pages qui s'ouvrent par-dessus.
// La barre de navigation est posée sous la pile d'écrans : elle reste visible partout.
export default function LayoutApp() {
  const { session } = useSession();
  const estDirecteur = session?.utilisateur.role === 'DIRECTEUR';

  return (
    <View style={styles.app}>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: couleurs.fond },
          headerTintColor: couleurs.encre,
          headerTitleStyle: { fontFamily: polices.texteGras, fontSize: 17 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: couleurs.fond },
        }}
      >
        <Stack.Screen name="(onglets)" options={{ headerShown: false }} />
        <Stack.Screen name="fiches/[id]/index" options={{ title: 'Fiche' }} />
        <Stack.Screen name="fiches/[id]/modifier" options={{ title: 'Modifier la fiche' }} />
        <Stack.Screen name="fiches/nouvelle" options={{ title: 'Nouvelle fiche' }} />
        <Stack.Screen name="offres/[id]" options={{ title: 'Offre' }} />
        <Stack.Screen name="profil" options={{ title: 'Profil' }} />
        {/* RG-15 : seuls les Directeurs peuvent ouvrir la création d'offre, même par un lien direct. */}
        <Stack.Protected guard={estDirecteur}>
          <Stack.Screen name="creer" options={{ title: 'Créer', presentation: 'modal' }} />
          <Stack.Screen name="offres/nouvelle" options={{ title: 'Nouvelle offre' }} />
        </Stack.Protected>
      </Stack>
      <BarreOnglets />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: couleurs.fond },
});
