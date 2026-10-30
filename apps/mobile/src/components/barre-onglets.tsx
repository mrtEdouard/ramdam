import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import {
  Backpack,
  BriefcaseBusiness,
  Compass,
  House,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';
import { useSession } from '@/session/session-context';

const onglets: Record<string, { libelle: string; icone: LucideIcon }> = {
  index: { libelle: 'Accueil', icone: House },
  activites: { libelle: 'Activités', icone: Compass },
  offres: { libelle: 'Offres', icone: BriefcaseBusiness },
  malle: { libelle: 'Malle', icone: Backpack },
};

// Barre de navigation du bas : quatre onglets et, au centre, le bouton de création.
export function BarreOnglets({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { session } = useSession();

  function creer() {
    // Un Directeur choisit entre fiche et offre ; un Animateur ne peut créer que des fiches.
    router.push(session?.utilisateur.role === 'DIRECTEUR' ? '/creer' : '/fiches/nouvelle');
  }

  const boutons = state.routes.map((route, position) => {
    const onglet = onglets[route.name];
    if (!onglet) {
      return null;
    }
    const actif = state.index === position;
    const Icone = onglet.icone;
    return (
      <Pressable
        key={route.key}
        onPress={() => navigateToTab(route.key)}
        style={styles.onglet}
        accessibilityRole="tab"
        accessibilityState={{ selected: actif }}
        accessibilityLabel={onglet.libelle}
      >
        <Icone
          size={24}
          color={actif ? couleurs.encre : couleurs.encre2}
          strokeWidth={actif ? 2.25 : 1.75}
        />
        <Text style={[styles.libelle, actif && styles.libelleActif]}>{onglet.libelle}</Text>
      </Pressable>
    );
  });

  return (
    <View style={[styles.barre, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.contenu} accessibilityRole="tablist">
        {boutons.slice(0, 2)}
        <View style={styles.onglet}>
          <Pressable
            onPress={creer}
            style={({ pressed }) => [styles.boutonCreer, pressed && styles.appuye]}
            accessibilityRole="button"
            accessibilityLabel="Créer"
          >
            <Plus size={28} color={couleurs.surface} strokeWidth={2.5} />
          </Pressable>
        </View>
        {boutons.slice(2)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barre: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  // Sur grand écran, les onglets restent groupés au centre au lieu de s'étaler.
  contenu: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  onglet: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 },
  libelle: { fontFamily: polices.texteMoyen, fontSize: 12, color: couleurs.encre2 },
  libelleActif: { fontFamily: polices.texteGras, color: couleurs.encre },
  boutonCreer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.corail,
  },
  appuye: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
