import {
  libellesTypeStructure,
  regions,
  typesStructure,
  type OffreResume,
  type PageDOffres,
  type Region,
  type TypeStructure,
} from '@ramdam/shared';
import { router, useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LigneOffre } from '@/components/ligne-offre';
import { MessageErreur } from '@/components/message-erreur';
import { Puce } from '@/components/puce';
import { couleurs, polices } from '@/constants/theme';
import { ErreurApi, lire } from '@/lib/api';
import { moisEtAnnee } from '@/lib/format';
import { useSession } from '@/session/session-context';

// Les 6 prochains mois, pour filtrer par période : { valeur: '2027-07', libelle: 'juil. 2027' }.
function prochainsMois() {
  const aujourdhui = new Date();
  return Array.from({ length: 6 }, (_, decalage) => {
    const date = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + decalage, 1);
    const valeur = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { valeur, libelle: moisEtAnnee(date) };
  });
}

export default function Offres() {
  const { session, deconnecter } = useSession();
  const estDirecteur = session?.utilisateur.role === 'DIRECTEUR';
  // Un Directeur peut basculer sur ses propres offres, clôturées comprises.
  const [vue, setVue] = useState<'toutes' | 'miennes'>('toutes');
  const [region, setRegion] = useState<Region | undefined>();
  const [mois, setMois] = useState<string | undefined>();
  const [typeStructure, setTypeStructure] = useState<TypeStructure | undefined>();
  const [resultat, setResultat] = useState<PageDOffres | null>(null);
  const [miennes, setMiennes] = useState<OffreResume[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(
    async (page: number) => {
      if (!session) {
        return;
      }
      const filtres = new URLSearchParams({ page: String(page) });
      if (region) filtres.set('region', region);
      if (mois) filtres.set('mois', mois);
      if (typeStructure) filtres.set('typeStructure', typeStructure);

      setChargement(true);
      try {
        const suite = await lire<PageDOffres>(`/offres?${filtres}`, session.jeton);
        // Page 1 : on remplace la liste. Pages suivantes : on ajoute à la fin.
        setResultat((precedent) =>
          page === 1 || !precedent
            ? suite
            : { ...suite, offres: [...precedent.offres, ...suite.offres] },
        );
        setErreur(null);
      } catch (e) {
        if (e instanceof ErreurApi && e.statut === 401) {
          await deconnecter();
          return;
        }
        setErreur(e instanceof ErreurApi ? e.message : 'Impossible de charger les offres.');
      } finally {
        setChargement(false);
      }
    },
    [session, deconnecter, region, mois, typeStructure],
  );

  // Chaque changement de filtre relance la liste depuis la première page.
  useEffect(() => {
    charger(1);
  }, [charger]);

  // « Mes offres » est rechargé à chaque retour sur l'onglet (après une création, une clôture…).
  useFocusEffect(
    useCallback(() => {
      if (session && estDirecteur && vue === 'miennes') {
        lire<OffreResume[]>('/offres/miennes', session.jeton)
          .then(setMiennes)
          .catch(() => setErreur('Impossible de charger tes offres.'));
      }
    }, [session, estDirecteur, vue]),
  );

  function pageSuivante() {
    if (vue === 'toutes' && resultat && resultat.page < resultat.pages && !chargement) {
      charger(resultat.page + 1);
    }
  }

  const entete = (
    <View style={styles.entete}>
      <View style={styles.ligneTitre}>
        <Text style={styles.titre} accessibilityRole="header">
          Offres
        </Text>
        {estDirecteur && (
          <Pressable
            onPress={() => router.push('/offres/nouvelle')}
            style={styles.publier}
            accessibilityRole="button"
            accessibilityLabel="Publier une offre"
          >
            <Plus size={18} color={couleurs.surface} strokeWidth={2.5} />
            <Text style={styles.textePublier}>Publier</Text>
          </Pressable>
        )}
      </View>

      {estDirecteur && (
        <View style={styles.vues}>
          <Puce
            libelle="Toutes les offres"
            choisie={vue === 'toutes'}
            onPress={() => setVue('toutes')}
          />
          <Puce
            libelle="Mes offres"
            choisie={vue === 'miennes'}
            onPress={() => setVue('miennes')}
          />
        </View>
      )}

      {vue === 'toutes' && (
        <>
          <Filtres
            tous="Toutes les régions"
            choix={regions.map((r) => ({ valeur: r, libelle: r }))}
            choisi={region}
            choisir={setRegion}
          />
          <Filtres
            tous="Toutes les dates"
            choix={prochainsMois()}
            choisi={mois}
            choisir={setMois}
          />
          <Filtres
            tous="Toutes les structures"
            choix={typesStructure.map((t) => ({ valeur: t, libelle: libellesTypeStructure[t] }))}
            choisi={typeStructure}
            choisir={setTypeStructure}
          />
          {resultat && (
            <Text style={styles.total} accessibilityLiveRegion="polite">
              {resultat.total} {resultat.total > 1 ? 'offres ouvertes' : 'offre ouverte'}
            </Text>
          )}
        </>
      )}
      {erreur && <MessageErreur message={erreur} />}
    </View>
  );

  const offres = vue === 'toutes' ? (resultat?.offres ?? []) : (miennes ?? []);

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      <FlatList
        data={offres}
        keyExtractor={(offre) => offre.id}
        renderItem={({ item }) => <LigneOffre offre={item} />}
        ItemSeparatorComponent={() => <View style={styles.separateur} />}
        ListHeaderComponent={entete}
        ListEmptyComponent={
          chargement ? undefined : (
            <Text style={styles.vide}>
              {vue === 'miennes'
                ? 'Tu n’as pas encore publié d’offre.'
                : 'Aucune offre ne correspond à ces filtres.'}
            </Text>
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
      />
    </SafeAreaView>
  );
}

type PropsFiltres<T extends string> = {
  tous: string;
  choix: { valeur: T; libelle: string }[];
  choisi: T | undefined;
  choisir: (valeur: T | undefined) => void;
};

// Une rangée de pastilles qui défile : « Toutes… » puis une pastille par valeur.
function Filtres<T extends string>({ tous, choix, choisi, choisir }: PropsFiltres<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.horsMarge}
      contentContainerStyle={styles.puces}
    >
      <Puce libelle={tous} choisie={!choisi} onPress={() => choisir(undefined)} />
      {choix.map(({ valeur, libelle }) => (
        <Puce
          key={valeur}
          libelle={libelle}
          choisie={choisi === valeur}
          onPress={() => choisir(valeur)}
        />
      ))}
    </ScrollView>
  );
}

const MARGE = 20;

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  liste: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: MARGE,
    paddingBottom: 32,
  },
  entete: { gap: 12, paddingTop: 12, marginBottom: 8 },
  ligneTitre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titre: { fontFamily: polices.titre, fontSize: 30, letterSpacing: -1, color: couleurs.encre },
  publier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: couleurs.corail,
  },
  textePublier: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.surface },
  vues: { flexDirection: 'row', gap: 8 },
  horsMarge: { marginHorizontal: -MARGE },
  puces: { gap: 8, paddingHorizontal: MARGE },
  total: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.encre2 },
  separateur: { height: 1, backgroundColor: couleurs.trait },
  vide: {
    fontFamily: polices.texte,
    fontSize: 15,
    color: couleurs.encre2,
    textAlign: 'center',
    paddingVertical: 32,
  },
  chargement: { paddingVertical: 20 },
});
