import { libellesTypeFiche, typesFiche, type PageDeFiches, type TypeFiche } from '@ramdam/shared';
import { useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChampTexte } from '@/components/champ-texte';
import { LigneFiche } from '@/components/ligne-fiche';
import { MessageErreur } from '@/components/message-erreur';
import { Puce } from '@/components/puce';
import { couleurs, polices } from '@/constants/theme';
import { ErreurApi, lire } from '@/lib/api';
import { useSession } from '@/session/session-context';

const ages = [4, 6, 8, 10, 12, 15];

export default function Activites() {
  const { session } = useSession();
  // La recherche faite sur l'accueil arrive dans l'adresse : /activites?type=VEILLEE&age=8
  const parametres = useLocalSearchParams<{ type?: TypeFiche; recherche?: string; age?: string }>();
  const [type, setType] = useState<TypeFiche | undefined>(parametres.type);
  const [age, setAge] = useState<number | undefined>(
    parametres.age ? Number(parametres.age) : undefined,
  );
  const [saisie, setSaisie] = useState(parametres.recherche ?? '');
  const [recherche, setRecherche] = useState(parametres.recherche ?? '');
  const [resultat, setResultat] = useState<PageDeFiches | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => setType(parametres.type), [parametres.type]);
  useEffect(() => {
    if (parametres.recherche !== undefined) setSaisie(parametres.recherche);
  }, [parametres.recherche]);
  useEffect(() => {
    if (parametres.age !== undefined) setAge(Number(parametres.age));
  }, [parametres.age]);

  // La recherche part 300 ms après la dernière touche, pas à chaque lettre tapée.
  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(saisie.trim()), 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);

  const charger = useCallback(
    async (page: number) => {
      if (!session) {
        return;
      }
      const filtres = new URLSearchParams({ page: String(page) });
      if (type) filtres.set('type', type);
      if (age) filtres.set('age', String(age));
      if (recherche) filtres.set('recherche', recherche);

      setChargement(true);
      try {
        const suite = await lire<PageDeFiches>(`/fiches?${filtres}`, session.jeton);
        // Page 1 : nouvelle recherche, on remplace. Pages suivantes : on ajoute à la fin.
        setResultat((precedent) =>
          page === 1 || !precedent
            ? suite
            : { ...suite, fiches: [...precedent.fiches, ...suite.fiches] },
        );
        setErreur(null);
      } catch (e) {
        // 401 : la session est refusée, lib/api.ts déconnecte déjà et renvoie à la connexion.
        if (e instanceof ErreurApi && e.statut === 401) {
          return;
        }
        setErreur(e instanceof ErreurApi ? e.message : 'Impossible de charger les activités.');
      } finally {
        setChargement(false);
      }
    },
    [session, type, age, recherche],
  );

  // Chaque changement de filtre relance la recherche depuis la première page.
  useEffect(() => {
    charger(1);
  }, [charger]);

  function pageSuivante() {
    if (resultat && resultat.page < resultat.pages && !chargement) {
      charger(resultat.page + 1);
    }
  }

  const entete = (
    <View style={styles.entete}>
      <Text style={styles.titre} accessibilityRole="header">
        Activités
      </Text>
      <ChampTexte
        libelle="Rechercher"
        icone={Search}
        placeholder="Un titre : loup-garou, rallye…"
        value={saisie}
        onChangeText={setSaisie}
        returnKeyType="search"
        autoCorrect={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horsMarge}
        contentContainerStyle={styles.puces}
      >
        <Puce libelle="Tous les types" choisie={!type} onPress={() => setType(undefined)} />
        {typesFiche.map((t) => (
          <Puce
            key={t}
            libelle={libellesTypeFiche[t]}
            choisie={type === t}
            onPress={() => setType(t)}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horsMarge}
        contentContainerStyle={styles.puces}
      >
        <Puce libelle="Tous les âges" choisie={!age} onPress={() => setAge(undefined)} />
        {ages.map((a) => (
          <Puce key={a} libelle={`${a} ans`} choisie={age === a} onPress={() => setAge(a)} />
        ))}
      </ScrollView>
      {erreur && <MessageErreur message={erreur} />}
      {resultat && (
        <Text style={styles.total} accessibilityLiveRegion="polite">
          {resultat.total} {resultat.total > 1 ? 'activités' : 'activité'}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      <FlatList
        data={resultat?.fiches ?? []}
        keyExtractor={(fiche) => fiche.id}
        renderItem={({ item }) => <LigneFiche fiche={item} />}
        ListHeaderComponent={entete}
        ListEmptyComponent={
          chargement ? undefined : (
            <Text style={styles.vide}>Aucune activité ne correspond à ces filtres.</Text>
          )
        }
        ListFooterComponent={
          chargement ? (
            <ActivityIndicator color={couleurs.corail} style={styles.chargement} />
          ) : undefined
        }
        // La page suivante se charge quand il reste moins d'un demi-écran à faire défiler.
        onEndReached={pageSuivante}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.liste}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const MARGE = 20;

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  liste: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: 12,
    paddingHorizontal: MARGE,
    paddingBottom: 32,
  },
  entete: { gap: 14, paddingTop: 12, marginBottom: 4 },
  titre: { fontFamily: polices.titre, fontSize: 30, letterSpacing: -1, color: couleurs.encre },
  horsMarge: { marginHorizontal: -MARGE },
  puces: { gap: 8, paddingHorizontal: MARGE },
  total: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.encre2 },
  vide: {
    fontFamily: polices.texte,
    fontSize: 15,
    color: couleurs.encre2,
    textAlign: 'center',
    paddingVertical: 32,
  },
  chargement: { paddingVertical: 20 },
});
