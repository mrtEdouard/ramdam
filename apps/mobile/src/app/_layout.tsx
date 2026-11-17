import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ToastProvider } from '@/components/toast';
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
    <CadreTelephone>
      <SessionProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Navigation pret={policesChargees || erreurPolices !== null} />
        </ToastProvider>
      </SessionProvider>
    </CadreTelephone>
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

// Ramdam est une app de téléphone : sur un écran d'ordinateur, elle s'affiche au centre,
// dans un cadre de la taille d'un téléphone, au lieu de s'étirer sur toute la largeur.
function CadreTelephone({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web' || width <= 500) {
    return children;
  }
  return (
    <View style={styles.bureau}>
      <View style={styles.telephone}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bureau: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#E4DCCD',
  },
  telephone: {
    width: 430,
    height: '100%',
    maxHeight: 932,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: couleurs.fond,
    boxShadow: '0 30px 80px rgba(30, 26, 22, 0.22)',
  },
});
