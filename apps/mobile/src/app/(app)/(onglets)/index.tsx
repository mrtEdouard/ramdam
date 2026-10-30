import { Link } from 'expo-router';
import {
  Dices,
  Flag,
  Moon,
  Palette,
  Search,
  Sparkles,
  Volleyball,
  type LucideIcon,
} from 'lucide-react-native';
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { CarteFiche } from '@/components/carte-fiche';
import { CarteUne } from '@/components/carte-une';
import { LigneOffre } from '@/components/ligne-offre';
import { Logo } from '@/components/logo';
import { couleurs, polices } from '@/constants/theme';
import { fichesRecentes, offresRecentes, type FicheResume, type TypeFiche } from '@/donnees/demo';
import { useSession } from '@/session/session-context';

const categories: { type: TypeFiche; libelle: string; icone: LucideIcon }[] = [
  { type: 'VEILLEE', libelle: 'Veillées', icone: Moon },
  { type: 'GRAND_JEU', libelle: 'Grands jeux', icone: Flag },
  { type: 'JEU', libelle: 'Jeux', icone: Dices },
  { type: 'MANUEL', libelle: 'Manuel', icone: Palette },
  { type: 'SPORTIF', libelle: 'Sportif', icone: Volleyball },
  { type: 'AUTRE', libelle: 'Autres', icone: Sparkles },
];

export default function Accueil() {
  const { session } = useSession();
  if (!session) {
    return null;
  }
  const { pseudo } = session.utilisateur;
  const aLaUne = ficheALaUne(fichesRecentes);
  const autresFiches = fichesRecentes.filter((fiche) => fiche.id !== aLaUne.id);

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      <ScrollView contentContainerStyle={styles.defilement} showsVerticalScrollIndicator={false}>
        <View style={styles.entete}>
          <Logo />
          <Link href="/profil" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Mon profil" hitSlop={8}>
              <Avatar pseudo={pseudo} taille={40} />
            </Pressable>
          </Link>
        </View>

        <View style={styles.salutation}>
          <Text style={styles.bonjour} accessibilityRole="header">
            Salut {pseudo}
          </Text>
          <Text style={styles.question}>Qu'est-ce qu'on anime cette semaine ?</Text>
        </View>

        {/* Raccourci vers la recherche de la page Activités. */}
        <Link href="/activites" asChild>
          <Pressable style={styles.recherche} accessibilityLabel="Rechercher une activité">
            <Search size={20} color={couleurs.encre2} strokeWidth={1.75} />
            <Text style={styles.texteRecherche}>Une veillée, un âge, un thème…</Text>
          </Pressable>
        </Link>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horsMarge}
          contentContainerStyle={styles.categories}
        >
          {categories.map(({ type, libelle, icone: Icone }) => (
            <Link key={type} href={{ pathname: '/activites', params: { type } }} asChild>
              <Pressable
                style={styles.categorie}
                accessibilityLabel={`Voir les ${libelle.toLowerCase()}`}
              >
                <Icone size={18} color={couleurs.corail} strokeWidth={2} />
                <Text style={styles.texteCategorie}>{libelle}</Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>

        <EnTeteSection titre="À la une" sousTitre="L'activité la plus aimée de la semaine" />
        <CarteUne fiche={aLaUne} />

        <EnTeteSection titre="Activités récentes publiées" lien="/activites" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horsMarge}
          contentContainerStyle={styles.carrousel}
        >
          {autresFiches.map((fiche) => (
            <CarteFiche key={fiche.id} fiche={fiche} />
          ))}
        </ScrollView>

        <EnTeteSection titre="Offres récentes publiées" lien="/offres" />
        <View style={styles.panneauOffres}>
          {offresRecentes.map((offre, position) => (
            <Fragment key={offre.id}>
              {position > 0 && <View style={styles.separateur} />}
              <LigneOffre offre={offre} />
            </Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// La fiche qui a reçu le plus de « j'aime » ces 7 derniers jours ; à égalité, la plus récente.
// Sans aucun « j'aime » cette semaine, c'est simplement la plus récente qui est à la une.
// Ce calcul sera fait par l'API (GET /fiches/a-la-une) quand elle existera.
function ficheALaUne(fiches: FicheResume[]) {
  return [...fiches].sort(
    (a, b) =>
      b.aimeeCetteSemaine - a.aimeeCetteSemaine || b.publieeLe.getTime() - a.publieeLe.getTime(),
  )[0];
}

type PropsEnTete = { titre: string; sousTitre?: string; lien?: '/activites' | '/offres' };

function EnTeteSection({ titre, sousTitre, lien }: PropsEnTete) {
  return (
    <View style={styles.enTeteSection}>
      <View style={styles.titres}>
        <Text style={styles.titreSection} accessibilityRole="header">
          {titre}
        </Text>
        {sousTitre && <Text style={styles.sousTitre}>{sousTitre}</Text>}
      </View>
      {lien && (
        <Link href={lien} style={styles.toutVoir} accessibilityLabel={`Tout voir : ${titre}`}>
          Tout voir
        </Link>
      )}
    </View>
  );
}

const MARGE = 20;

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  defilement: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: MARGE,
    paddingBottom: 32,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  salutation: { marginTop: 12, gap: 4 },
  bonjour: {
    fontFamily: polices.titre,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
    color: couleurs.encre,
  },
  question: { fontFamily: polices.texte, fontSize: 16, color: couleurs.encre2 },
  recherche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  texteRecherche: { fontFamily: polices.texte, fontSize: 15, color: couleurs.encre2 },
  // Les listes horizontales débordent jusqu'aux bords de l'écran,
  // mais leur premier élément reste aligné sur la marge.
  horsMarge: { marginHorizontal: -MARGE },
  categories: { gap: 8, paddingHorizontal: MARGE, paddingTop: 14 },
  categorie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  texteCategorie: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.encre },
  enTeteSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 30,
    marginBottom: 14,
  },
  titres: { flexShrink: 1, gap: 2 },
  sousTitre: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
  titreSection: {
    fontFamily: polices.titre,
    fontSize: 21,
    letterSpacing: -0.6,
    color: couleurs.encre,
  },
  toutVoir: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.corail },
  carrousel: { gap: 14, paddingHorizontal: MARGE },
  panneauOffres: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  separateur: { height: 1, marginLeft: 68, backgroundColor: couleurs.trait },
});
