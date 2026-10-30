import { Tabs } from 'expo-router';
import { BarreOnglets } from '@/components/barre-onglets';
import { couleurs } from '@/constants/theme';

// Les quatre onglets principaux, avec notre propre barre de navigation.
export default function LayoutOnglets() {
  return (
    <Tabs
      tabBar={(props) => <BarreOnglets {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: couleurs.fond } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activites" />
      <Tabs.Screen name="offres" />
      <Tabs.Screen name="malle" />
    </Tabs>
  );
}
