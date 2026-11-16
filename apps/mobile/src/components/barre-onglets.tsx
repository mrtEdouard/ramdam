import { router, usePathname, type Href } from 'expo-router';
import {
  Backpack,
  BriefcaseBusiness,
  Compass,
  House,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { couleurs, polices } from '@/constants/theme';
import { useSession } from '@/session/session-context';

const onglets: { chemin: Href & string; libelle: string; icone: LucideIcon }[] = [
  { chemin: '/', libelle: 'Accueil', icone: House },
  { chemin: '/activites', libelle: 'Activités', icone: Compass },
  { chemin: '/offres', libelle: 'Offres', icone: BriefcaseBusiness },
  { chemin: '/malle', libelle: 'Malle', icone: Backpack },
];

// Barre de navigation du bas : quatre onglets et, au centre, le bouton de création.
// Elle est posée sous toutes les pages de l'app (voir app/(app)/_layout.tsx), pas seulement
// sous les onglets : on la garde aussi sur le détail d'une fiche, le profil, etc.
export function BarreOnglets() {
  const { session } = useSession();
  const chemin = usePathname();
  const insets = useSafeAreaInsets();

  function creer() {
    // Un Directeur choisit entre fiche et offre ; un Animateur ne peut créer que des fiches.
    router.push(session?.utilisateur.role === 'DIRECTEUR' ? '/creer' : '/fiches/nouvelle');
  }

  const boutons = onglets.map((onglet) => {
    // L'onglet Offres reste allumé sur le détail d'une offre (/offres/…).
    const actif =
      chemin === onglet.chemin || (onglet.chemin !== '/' && chemin.startsWith(`${onglet.chemin}/`));
    const Icone = onglet.icone;
    return (
      <Pressable
        key={onglet.chemin}
        // navigate : revient à l'onglet en refermant les pages ouvertes par-dessus.
        onPress={() => router.navigate(onglet.chemin)}
        style={styles.onglet}
        accessibilityRole="tab"
        aria-selected={actif}
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
  contenu: { flexDirection: 'row', alignItems: 'center' },
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
