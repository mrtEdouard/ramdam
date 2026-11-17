import type { PageDeFiches, Profil } from '@ramdam/shared';
import { useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CarteProfil, CompteursProfil } from '@/components/carte-profil';
import { LigneFiche } from '@/components/ligne-fiche';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';

// Nombre d'activités affichées par page sur un profil.
const PAR_PAGE = 5;

// Profil public d'un animateur : son rang, ses compteurs et ses fiches publiées, 5 par 5.
export default function ProfilPublic() {
  const { pseudo } = useLocalSearchParams<{ pseudo: string }>();
  // encodeURIComponent : un pseudo peut contenir un point (« lea.anim »).
  const profil = useRequete<Profil>(`/profils/${encodeURIComponent(pseudo)}`);
  const [page, setPage] = useState(1);
  // Changer de page change l'adresse : useRequete recharge alors la bonne page.
  // La pagination est faite par l'API (skip / take), on ne charge jamais plus de 5 fiches.
  const fiches = useRequete<PageDeFiches>(
    `/fiches?auteur=${encodeURIComponent(pseudo)}&parPage=${PAR_PAGE}&page=${page}`,
  );
  const nbPages = fiches.donnees?.pages ?? 1;

  if (profil.erreur) {
    return (
      <View style={styles.centre}>
        <MessageErreur message={profil.erreur} />
      </View>
    );
  }
  if (!profil.donnees) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={couleurs.corail} accessibilityLabel="Chargement du profil" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <CarteProfil profil={profil.donnees} />
      <CompteursProfil profil={profil.donnees} />

      <Text style={styles.titreSection} accessibilityRole="header">
        Ses activités
        {fiches.donnees && fiches.donnees.total > 0 ? ` (${fiches.donnees.total})` : ''}
      </Text>
      {fiches.donnees?.fiches.length === 0 && (
        <Text style={styles.vide}>{pseudo} n’a pas encore publié d’activité.</Text>
      )}
      {fiches.donnees?.fiches.map((fiche) => (
        <LigneFiche key={fiche.id} fiche={fiche} />
      ))}

      {nbPages > 1 && (
        <View style={styles.pagination}>
          <BoutonPage
            libelle="Précédentes"
            actif={page > 1}
            onPress={() => setPage(page - 1)}
            icone="avant"
          />
          <Text style={styles.numeroPage}>
            {page} / {nbPages}
          </Text>
          <BoutonPage
            libelle="Suivantes"
            actif={page < nbPages}
            onPress={() => setPage(page + 1)}
            icone="apres"
          />
        </View>
      )}
    </ScrollView>
  );
}

type PropsBoutonPage = {
  libelle: string;
  actif: boolean;
  onPress: () => void;
  icone: 'avant' | 'apres';
};

function BoutonPage({ libelle, actif, onPress, icone }: PropsBoutonPage) {
  const couleur = actif ? couleurs.encre : couleurs.encre3;
  return (
    <Pressable
      onPress={onPress}
      disabled={!actif}
      style={styles.boutonPage}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ disabled: !actif }}
      accessibilityLabel={`Activités ${libelle.toLowerCase()}`}
    >
      {icone === 'avant' && <ChevronLeft size={18} color={couleur} />}
      <Text style={[styles.texteBoutonPage, { color: couleur }]}>{libelle}</Text>
      {icone === 'apres' && <ChevronRight size={18} color={couleur} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: couleurs.fond,
  },
  page: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  titreSection: {
    marginTop: 8,
    fontFamily: polices.titre,
    fontSize: 21,
    letterSpacing: -0.6,
    color: couleurs.encre,
  },
  vide: { fontFamily: polices.texte, fontSize: 15, color: couleurs.encre2 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: couleurs.trait,
  },
  boutonPage: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44 },
  texteBoutonPage: { fontFamily: polices.texteGras, fontSize: 15 },
  numeroPage: { fontFamily: polices.texteMoyen, fontSize: 15, color: couleurs.encre2 },
});
