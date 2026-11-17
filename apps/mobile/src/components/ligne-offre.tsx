import type { OffreResume } from '@ramdam/shared';
import { Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';
import { jourEtMois, periode } from '@/lib/format';

// Une offre dans une liste, présentée comme un agenda : la date de début en premier.
export function LigneOffre({ offre }: { offre: OffreResume }) {
  const debut = new Date(offre.dateDebut);
  const { jour, mois } = jourEtMois(debut);

  return (
    <Link href={{ pathname: '/offres/[id]', params: { id: offre.id } }} asChild>
      <Pressable
        style={styles.ligne}
        accessibilityLabel={`${offre.intitule}, ${offre.structure}, ${offre.region}, ${periode(debut, new Date(offre.dateFin))}${offre.statut === 'CLOTUREE' ? ', clôturée' : ''}`}
      >
        <View style={styles.date}>
          <Text style={styles.jour}>{jour}</Text>
          <Text style={styles.mois}>{mois}</Text>
        </View>
        <View style={styles.textes}>
          <Text style={styles.intitule} numberOfLines={2}>
            {offre.intitule}
          </Text>
          <Text style={styles.details} numberOfLines={1}>
            {offre.structure} · {offre.region}
          </Text>
          {offre.statut === 'CLOTUREE' && <Text style={styles.cloturee}>Clôturée</Text>}
        </View>
        <ChevronRight size={20} color={couleurs.encre2} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  date: {
    width: 54,
    height: 58,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: couleurs.encre,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.surface,
  },
  jour: { fontFamily: polices.titre, fontSize: 22, lineHeight: 24, color: couleurs.encre },
  mois: { fontFamily: polices.texteGras, fontSize: 12, color: couleurs.encre2 },
  textes: { flex: 1, gap: 2 },
  intitule: { fontFamily: polices.texteGras, fontSize: 16, color: couleurs.encre },
  cloturee: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: couleurs.trait,
    fontFamily: polices.texteGras,
    fontSize: 12,
    color: couleurs.encre2,
  },
  details: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
});
