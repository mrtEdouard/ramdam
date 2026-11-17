import { libellesTypeStructure, type OffreDetail } from '@ramdam/shared';
import { useLocalSearchParams } from 'expo-router';
import { BadgeCheck, CalendarDays, GraduationCap, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bouton } from '@/components/bouton';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { periode } from '@/lib/format';

export default function DetailOffre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: offre, erreur } = useRequete<OffreDetail>(`/offres/${id}`);

  if (erreur) {
    return (
      <View style={styles.centre}>
        <MessageErreur message={erreur} />
      </View>
    );
  }
  if (!offre) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={couleurs.corail} accessibilityLabel="Chargement de l'offre" />
      </View>
    );
  }

  // Les candidatures se font hors de Ramdam : on ouvre l'e-mail ou le site de la structure.
  const estEmail = offre.contactExterne.includes('@') && !offre.contactExterne.startsWith('http');
  const lienContact = estEmail ? `mailto:${offre.contactExterne}` : offre.contactExterne;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.structure}>
        {libellesTypeStructure[offre.typeStructure]} · {offre.structure}
      </Text>
      <Text style={styles.titre} accessibilityRole="header">
        {offre.intitule}
      </Text>
      <View style={styles.directeur}>
        <BadgeCheck size={16} color={couleurs.succes} strokeWidth={2} />
        <Text style={styles.texteDirecteur}>Publiée par {offre.directeur}, Directeur</Text>
      </View>

      <View style={styles.infos}>
        <Info icone={<MapPin size={18} color={couleurs.corail} />} texte={offre.region} />
        <Info
          icone={<CalendarDays size={18} color={couleurs.corail} />}
          texte={periode(new Date(offre.dateDebut), new Date(offre.dateFin))}
        />
        <Info
          icone={<GraduationCap size={18} color={couleurs.corail} />}
          texte={
            offre.diplomeRequis
              ? `Diplôme demandé : ${offre.diplomeRequis}`
              : 'Pas de diplôme demandé'
          }
        />
      </View>

      <Text style={styles.titreSection} accessibilityRole="header">
        Le poste
      </Text>
      <Text style={styles.texte}>{offre.description}</Text>

      <Bouton
        titre={estEmail ? 'Candidater par e-mail' : 'Candidater sur le site'}
        onPress={() => Linking.openURL(lienContact)}
      />
      <Text style={styles.note}>La candidature se fait directement auprès de la structure.</Text>
    </ScrollView>
  );
}

function Info({ icone, texte }: { icone: ReactNode; texte: string }) {
  return (
    <View style={styles.info}>
      {icone}
      <Text style={styles.texteInfo}>{texte}</Text>
    </View>
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
    maxWidth: 720,
    alignSelf: 'center',
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  structure: { fontFamily: polices.texteGras, fontSize: 14, color: couleurs.corail },
  titre: {
    fontFamily: polices.titre,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: couleurs.encre,
  },
  directeur: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  texteDirecteur: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.succes },
  infos: {
    gap: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  texteInfo: { flex: 1, fontFamily: polices.texte, fontSize: 15, color: couleurs.encre },
  titreSection: {
    fontFamily: polices.titre,
    fontSize: 19,
    letterSpacing: -0.4,
    color: couleurs.encre,
  },
  texte: { fontFamily: polices.texte, fontSize: 16, lineHeight: 24, color: couleurs.encre },
  note: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2, textAlign: 'center' },
});
