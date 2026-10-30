import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { couleurs } from '@/constants/theme';
import { SessionProvider, useSession } from '@/session/session-context';

// L'écran de démarrage reste affiché tant que les polices et la session ne sont pas prêtes.
SplashScreen.preventAutoHideAsync();

export default function LayoutRacine() {
  const [policesChargees, erreurPolices] = useFonts({
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Navigation pret={policesChargees || erreurPolices !== null} />
    </SessionProvider>
  );
}

function Navigation({ pret }: { pret: boolean }) {
  const { session, chargement } = useSession();
  const toutEstPret = pret && !chargement;

  useEffect(() => {
    if (toutEstPret) {
      SplashScreen.hideAsync();
    }
  }, [toutEstPret]);

  if (!toutEstPret) {
    return null;
  }

  // Stack.Protected : un écran dont la garde est fausse n'existe pas pour la navigation.
  // Connecté, on ne peut plus ouvrir la connexion ; déconnecté, on est renvoyé vers elle.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }}>
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="connexion" />
        <Stack.Screen name="inscription" />
      </Stack.Protected>
    </Stack>
  );
}
