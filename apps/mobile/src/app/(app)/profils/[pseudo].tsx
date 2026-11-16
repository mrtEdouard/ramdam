import type { PageDeFiches, Profil } from '@ramdam/shared';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CarteProfil, CompteursProfil } from '@/components/carte-profil';
import { LigneFiche } from '@/components/ligne-fiche';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';

// Profil public d'un animateur : son rang, ses compteurs et ses fiches publiées.
export default function ProfilPublic() {
  const { pseudo } = useLocalSearchParams<{ pseudo: string }>();
  // encodeURIComponent : un pseudo peut contenir un point (« lea.anim »).
  const profil = useRequete<Profil>(`/profils/${encodeURIComponent(pseudo)}`);
  const fiches = useRequete<PageDeFiches>(
    `/fiches?auteur=${encodeURIComponent(pseudo)}&parPage=50`,
  );

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
      </Text>
      {fiches.donnees?.fiches.length === 0 && (
        <Text style={styles.vide}>{pseudo} n’a pas encore publié d’activité.</Text>
      )}
      {fiches.donnees?.fiches.map((fiche) => (
        <LigneFiche key={fiche.id} fiche={fiche} />
      ))}
    </ScrollView>
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
});
