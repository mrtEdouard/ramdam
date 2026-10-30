import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Clock, Heart, Smile } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { couleurs, polices } from '@/constants/theme';
import { libellesTypeFiche, type FicheResume } from '@/donnees/demo';
import { depuis, duree } from '@/lib/format';

// Grande carte « À la une » : la photo en pleine largeur, les informations dans un encart blanc.
export function CarteUne({ fiche }: { fiche: FicheResume }) {
  return (
    <Link href={{ pathname: '/fiches/[id]', params: { id: fiche.id } }} asChild>
      <Pressable
        style={styles.carte}
        accessibilityLabel={`À la une : ${fiche.titre}, ${libellesTypeFiche[fiche.type]}, par ${fiche.auteur}, ${fiche.aimeeCetteSemaine} j'aime cette semaine`}
      >
        <Image source={fiche.image} style={styles.image} contentFit="cover" transition={150} />
        <View style={styles.encart}>
          <Text style={styles.type}>{libellesTypeFiche[fiche.type]}</Text>
          <Text style={styles.titre} numberOfLines={2}>
            {fiche.titre}
          </Text>
          <View style={styles.ligne}>
            <View style={styles.info}>
              <Smile size={15} color={couleurs.encre2} strokeWidth={1.75} />
              <Text style={styles.texteInfo}>
                {fiche.ageMin}–{fiche.ageMax} ans
              </Text>
            </View>
            <View style={styles.info}>
              <Clock size={15} color={couleurs.encre2} strokeWidth={1.75} />
              <Text style={styles.texteInfo}>{duree(fiche.dureeMinutes)}</Text>
            </View>
            {fiche.aimeeCetteSemaine > 0 && (
              <View style={styles.info}>
                <Heart
                  size={15}
                  color={couleurs.corail}
                  fill={couleurs.corail}
                  strokeWidth={1.75}
                />
                <Text style={styles.texteInfo}>{fiche.aimeeCetteSemaine}</Text>
              </View>
            )}
          </View>
          <View style={styles.auteur}>
            <Avatar pseudo={fiche.auteur} taille={22} />
            <Text style={styles.texteInfo} numberOfLines={1}>
              {fiche.auteur} · {depuis(fiche.publieeLe)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  carte: { height: 300, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' },
  image: { ...StyleSheet.absoluteFill, backgroundColor: couleurs.trait },
  encart: {
    margin: 10,
    padding: 16,
    gap: 4,
    borderRadius: 18,
    backgroundColor: couleurs.surface,
  },
  type: {
    fontFamily: polices.texteGras,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: couleurs.corail,
  },
  titre: {
    fontFamily: polices.titre,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.5,
    color: couleurs.encre,
  },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  auteur: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  texteInfo: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
});
