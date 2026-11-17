import type { FicheResume } from '@ramdam/shared';
import { Link } from 'expo-router';
import { Bookmark, Plus } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LigneFiche } from '@/components/ligne-fiche';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';

// La Malle : les fiches de la personne (brouillons compris), puis celles des autres qu'elle garde.
// Une fiche gardée est un simple lien : on voit toujours la dernière version écrite par son auteur.
export default function Malle() {
  const { donnees: fiches, erreur, chargement } = useRequete<FicheResume[]>('/fiches/miennes');
  const gardees = useRequete<FicheResume[]>('/fiches/gardees');

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.titre} accessibilityRole="header">
          Ma Malle
        </Text>

        <View style={styles.enteteSection}>
          <Text style={styles.titreSection} accessibilityRole="header">
            Mes fiches
          </Text>
          <Link href="/fiches/nouvelle" asChild>
            <Pressable
              style={styles.nouvelle}
              accessibilityRole="button"
              accessibilityLabel="Créer une fiche"
            >
              <Plus size={18} color={couleurs.corail} strokeWidth={2.5} />
              <Text style={styles.texteNouvelle}>Nouvelle</Text>
            </Pressable>
          </Link>
        </View>

        {erreur && <MessageErreur message={erreur} />}
        {chargement && !fiches && <ActivityIndicator color={couleurs.corail} />}
        {fiches?.length === 0 && (
          <Text style={styles.vide}>
            Tu n’as pas encore écrit de fiche. Partage ta meilleure activité !
          </Text>
        )}
        {fiches?.map((fiche) => (
          <LigneFiche key={fiche.id} fiche={fiche} avecStatut />
        ))}

        <Text style={[styles.titreSection, styles.espace]} accessibilityRole="header">
          Fiches gardées
        </Text>
        {gardees.erreur && <MessageErreur message={gardees.erreur} />}
        {gardees.donnees?.length === 0 && (
          <View style={styles.bientot}>
            <Bookmark size={22} color={couleurs.encre2} />
            <Text style={styles.texteBientot}>
              Garde les fiches des autres animateurs avec « Garder dans ma Malle » : elles arrivent
              ici.
            </Text>
          </View>
        )}
        {gardees.donnees?.map((fiche) => (
          <LigneFiche key={fiche.id} fiche={fiche} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  page: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: 40,
  },
  titre: {
    fontFamily: polices.titre,
    fontSize: 30,
    letterSpacing: -1,
    color: couleurs.encre,
    marginBottom: 6,
  },
  enteteSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titreSection: {
    fontFamily: polices.titre,
    fontSize: 21,
    letterSpacing: -0.6,
    color: couleurs.encre,
  },
  espace: { marginTop: 16 },
  nouvelle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: couleurs.corailDoux,
  },
  texteNouvelle: { fontFamily: polices.texteGras, fontSize: 14, color: couleurs.encre },
  vide: { fontFamily: polices.texte, fontSize: 15, color: couleurs.encre2 },
  bientot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: couleurs.trait,
  },
  texteBientot: { flex: 1, fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
});
