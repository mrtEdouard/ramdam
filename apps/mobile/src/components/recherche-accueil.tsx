import { libellesTypeFiche, type PageDeFiches, type TypeFiche } from '@ramdam/shared';
import { Link } from 'expo-router';
import {
  Dices,
  Flag,
  Moon,
  Palette,
  Search,
  Sparkles,
  Volleyball,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LigneFiche } from '@/components/ligne-fiche';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { ErreurApi, lire } from '@/lib/api';
import { lireRecherche } from '@/lib/recherche';
import { useSession } from '@/session/session-context';

const categories: { type: TypeFiche; libelle: string; icone: LucideIcon }[] = [
  { type: 'VEILLEE', libelle: 'Veillées', icone: Moon },
  { type: 'GRAND_JEU', libelle: 'Grands jeux', icone: Flag },
  { type: 'JEU', libelle: 'Jeux', icone: Dices },
  { type: 'MANUEL', libelle: 'Manuel', icone: Palette },
  { type: 'SPORTIF', libelle: 'Sportif', icone: Volleyball },
  { type: 'AUTRE', libelle: 'Autres', icone: Sparkles },
];

// Nombre de résultats montrés sur l'accueil ; « Voir tout » ouvre la page Activités.
const APERCU = 6;

type Props = {
  // Prévient l'accueil qu'une recherche est en cours : il masque alors ses autres sections.
  changerActif: (actif: boolean) => void;
};

// Recherche de l'accueil : on tape des mots (et un âge, « 8 ans »), on touche une catégorie,
// et les activités trouvées s'affichent tout de suite, sans quitter l'accueil.
export function RechercheAccueil({ changerActif }: Props) {
  const { session } = useSession();
  const [saisie, setSaisie] = useState('');
  const [type, setType] = useState<TypeFiche | undefined>();
  const [resultat, setResultat] = useState<PageDeFiches | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Numéro de la dernière recherche lancée : une réponse plus ancienne qui arrive en retard
  // est ignorée, sinon elle écraserait les résultats de la recherche la plus récente.
  const derniere = useRef(0);

  const { mots, age } = lireRecherche(saisie);
  const actif = mots.length >= 2 || age !== undefined || type !== undefined;

  useEffect(() => {
    changerActif(actif);
  }, [actif, changerActif]);

  useEffect(() => {
    if (!actif || !session) {
      setResultat(null);
      setErreur(null);
      return;
    }
    const filtres = new URLSearchParams({ parPage: String(APERCU) });
    if (mots.length >= 2) filtres.set('recherche', mots);
    if (age !== undefined) filtres.set('age', String(age));
    if (type) filtres.set('type', type);

    // On attend 300 ms sans nouvelle frappe avant d'interroger l'API.
    const numero = ++derniere.current;
    const minuteur = setTimeout(async () => {
      setChargement(true);
      try {
        const page = await lire<PageDeFiches>(`/fiches?${filtres}`, session.jeton);
        if (numero === derniere.current) {
          setResultat(page);
          setErreur(null);
        }
      } catch (e) {
        if (numero === derniere.current) {
          setErreur(e instanceof ErreurApi ? e.message : 'La recherche a échoué.');
        }
      } finally {
        if (numero === derniere.current) {
          setChargement(false);
        }
      }
    }, 300);
    return () => clearTimeout(minuteur);
  }, [actif, mots, age, type, session]);

  function effacer() {
    setSaisie('');
    setType(undefined);
  }

  // Ce qui est cherché, en clair : « Veillées · 8 ans · « loup » ».
  const resume = [
    type && libellesTypeFiche[type],
    age !== undefined && `${age} ans`,
    mots.length >= 2 && `« ${mots} »`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View>
      <View style={styles.champ}>
        <Search size={20} color={couleurs.encre2} strokeWidth={1.75} />
        <TextInput
          value={saisie}
          onChangeText={setSaisie}
          placeholder="Une veillée, un âge, un thème…"
          placeholderTextColor={couleurs.encre3}
          style={styles.saisie}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Rechercher une activité"
        />
        {(saisie.length > 0 || type) && (
          <Pressable
            onPress={effacer}
            hitSlop={10}
            style={styles.effacer}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
          >
            <X size={16} color={couleurs.surface} strokeWidth={2.5} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horsMarge}
        contentContainerStyle={styles.categories}
      >
        {categories.map(({ type: t, libelle, icone: Icone }) => {
          const choisie = type === t;
          return (
            <Pressable
              key={t}
              // Un second appui sur la catégorie choisie la retire.
              onPress={() => setType(choisie ? undefined : t)}
              style={[styles.categorie, choisie && styles.categorieChoisie]}
              accessibilityRole="button"
              accessibilityState={{ selected: choisie }}
              accessibilityLabel={`Filtrer : ${libelle.toLowerCase()}`}
            >
              <Icone
                size={18}
                color={choisie ? couleurs.surface : couleurs.corail}
                strokeWidth={2}
              />
              <Text style={[styles.texteCategorie, choisie && styles.texteChoisi]}>{libelle}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {actif && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <View style={styles.enteteResultats}>
            <Text style={styles.compte} accessibilityLiveRegion="polite">
              {resultat
                ? `${resultat.total} activité${resultat.total > 1 ? 's' : ''} · ${resume}`
                : resume}
            </Text>
            {chargement && <ActivityIndicator size="small" color={couleurs.corail} />}
          </View>

          {erreur && <MessageErreur message={erreur} />}

          {resultat?.total === 0 && (
            <Text style={styles.vide}>
              Aucune activité ne correspond. Essaie un autre mot, ou retire un filtre.
            </Text>
          )}

          {resultat?.fiches.map((fiche) => (
            <LigneFiche key={fiche.id} fiche={fiche} />
          ))}

          {resultat && resultat.total > resultat.fiches.length && (
            <Link
              href={{
                pathname: '/activites',
                params: {
                  ...(type && { type }),
                  ...(saisie.trim() && { recherche: mots }),
                  ...(age !== undefined && { age: String(age) }),
                },
              }}
              style={styles.toutVoir}
            >
              Voir les {resultat.total} activités
            </Link>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const MARGE = 20;

const styles = StyleSheet.create({
  champ: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  saisie: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    fontFamily: polices.texte,
    fontSize: 15,
    color: couleurs.encre,
    // Sur le web, la bordure du champ suffit : pas de contour bleu du navigateur.
    outlineWidth: 0,
    outlineStyle: 'solid',
  },
  effacer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.encre2,
  },
  // La rangée de catégories déborde jusqu'aux bords de l'écran,
  // mais sa première pastille reste alignée sur la marge.
  horsMarge: { marginHorizontal: -MARGE },
  categories: { gap: 8, paddingHorizontal: MARGE, paddingTop: 14 },
  categorie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  categorieChoisie: { borderColor: couleurs.encre, backgroundColor: couleurs.encre },
  texteCategorie: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.encre },
  texteChoisi: { color: couleurs.surface },
  enteteResultats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 22,
    marginBottom: 6,
  },
  compte: { flexShrink: 1, fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  vide: { fontFamily: polices.texte, fontSize: 15, color: couleurs.encre2, paddingVertical: 16 },
  toutVoir: {
    marginTop: 12,
    fontFamily: polices.texteGras,
    fontSize: 15,
    color: couleurs.corail,
  },
});
