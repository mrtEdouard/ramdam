import { libellesTypeStructure, type OffreResume } from '@ramdam/shared';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { couleurs, polices } from '@/constants/theme';
import { departProche, dureeOffre, jourEtMois, periode } from '@/lib/format';
import { imageDOffre } from '@/lib/images';

type Props = {
  offre: OffreResume;
  // Position dans la liste : décale l'apparition et l'inclinaison du timbre.
  position: number;
};

// Une offre présentée comme une carte postale de colo : la photo, un timbre avec la date
// de début, puis le poste, la ville et la période.
export function CarteOffre({ offre, position }: Props) {
  const { jour, mois } = jourEtMois(new Date(offre.dateDebut));
  const duree = dureeOffre(offre.dateDebut, offre.dateFin);
  const cloturee = offre.statut === 'CLOTUREE';
  const bientot = cloturee ? null : departProche(offre.dateDebut);

  // La carte s'enfonce un peu sous le doigt, puis revient avec un léger rebond.
  const echelle = useSharedValue(1);
  const styleAppui = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));

  return (
    // Apparition en cascade : chaque carte arrive un peu après la précédente (6 au plus).
    <Animated.View entering={FadeInDown.delay((position % 10) * 70).duration(380)}>
      <Link href={{ pathname: '/offres/[id]', params: { id: offre.id } }} asChild>
        <Pressable
          onPressIn={() => (echelle.value = withSpring(0.97, { damping: 15 }))}
          onPressOut={() => (echelle.value = withSpring(1, { damping: 12 }))}
          accessibilityLabel={`${offre.intitule}, ${offre.structure}, ${offre.ville}, ${periode(new Date(offre.dateDebut), new Date(offre.dateFin))}${cloturee ? ', poste pourvu' : ''}`}
        >
          <Animated.View style={[styles.carte, styleAppui]}>
            <View>
              <Image
                source={imageDOffre(offre)}
                style={[styles.photo, cloturee && styles.photoPassee]}
                contentFit="cover"
                transition={200}
              />
              <Text style={styles.type}>{libellesTypeStructure[offre.typeStructure]}</Text>
              {/* Le timbre : la date de début, posé de travers comme à la main. */}
              <View
                style={[
                  styles.timbre,
                  { transform: [{ rotate: position % 2 === 0 ? '4deg' : '-3deg' }] },
                ]}
              >
                <View style={styles.cadreTimbre}>
                  <Text style={styles.jour}>{jour}</Text>
                  <Text style={styles.mois}>{mois}</Text>
                </View>
              </View>
              {cloturee && (
                <View style={styles.tampon}>
                  <Text style={styles.texteTampon}>Poste pourvu</Text>
                </View>
              )}
            </View>

            <View style={styles.textes}>
              {bientot && <Text style={styles.bientot}>{bientot}</Text>}
              <Text style={styles.intitule} numberOfLines={2}>
                {offre.intitule}
              </Text>
              <Text style={styles.structure} numberOfLines={1}>
                {offre.structure}
              </Text>
              <View style={styles.infos}>
                <View style={styles.info}>
                  <MapPin size={15} color={couleurs.corail} strokeWidth={2.2} />
                  <Text style={styles.texteInfo} numberOfLines={1}>
                    <Text style={styles.ville}>{offre.ville}</Text> · {offre.region}
                  </Text>
                </View>
                <View style={styles.info}>
                  <CalendarDays size={15} color={couleurs.sapin} strokeWidth={2.2} />
                  <Text style={styles.texteInfo} numberOfLines={1}>
                    {periode(new Date(offre.dateDebut), new Date(offre.dateFin))}
                    {duree && ` · ${duree}`}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carte: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
    // Une ombre courte et chaude, comme une carte posée sur la table.
    shadowColor: '#5B3A1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  photo: {
    height: 172,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    backgroundColor: couleurs.trait,
  },
  photoPassee: { opacity: 0.55 },
  type: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: couleurs.sapin,
    fontFamily: polices.texteGras,
    fontSize: 12,
    letterSpacing: 0.3,
    color: couleurs.surface,
  },
  // Le bord en pointillés imite la dentelure d'un timbre.
  timbre: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    borderRadius: 3,
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  cadreTimbre: {
    width: 52,
    alignItems: 'center',
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: couleurs.corail,
  },
  jour: { fontFamily: polices.titre, fontSize: 24, lineHeight: 26, color: couleurs.corail },
  mois: {
    fontFamily: polices.texteGras,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: couleurs.encre,
  },
  tampon: {
    position: 'absolute',
    top: 62,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: couleurs.erreur,
    transform: [{ rotate: '-8deg' }],
    backgroundColor: 'rgba(255, 252, 246, 0.85)',
  },
  texteTampon: {
    fontFamily: polices.titre,
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: couleurs.erreur,
  },
  textes: { gap: 4, padding: 14, paddingTop: 12 },
  bientot: {
    alignSelf: 'flex-start',
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: couleurs.corailDoux,
    fontFamily: polices.texteGras,
    fontSize: 12,
    color: couleurs.corail,
  },
  intitule: {
    fontFamily: polices.titre,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: couleurs.encre,
  },
  structure: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.encre2 },
  infos: { gap: 5, marginTop: 6 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  texteInfo: { flex: 1, fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
  ville: { fontFamily: polices.texteGras, color: couleurs.encre },
});
