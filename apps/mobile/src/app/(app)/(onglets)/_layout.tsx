import { Tabs } from 'expo-router';
import { couleurs } from '@/constants/theme';

// Les quatre onglets principaux. Leur barre est dessinée une seule fois pour toute l'app,
// dans app/(app)/_layout.tsx : le navigateur d'onglets n'en affiche donc pas.
export default function LayoutOnglets() {
  return (
    <Tabs
      tabBar={() => null}
      backBehavior="history"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: couleurs.fond } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activites" />
      <Tabs.Screen name="offres" />
      <Tabs.Screen name="galerie" />
    </Tabs>
  );
}
