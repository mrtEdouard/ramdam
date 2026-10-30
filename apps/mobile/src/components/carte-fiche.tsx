import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { couleurs, polices } from '@/constants/theme';
import { libellesTypeFiche, type FicheResume } from '@/donnees/demo';
import { duree } from '@/lib/format';

// Carte d'une fiche dans un carrousel : la photo d'abord, le texte dessous, sans cadre.
// Link rend un vrai lien <a> sur le web ; asChild garde notre Pressable.
export function CarteFiche({ fiche }: { fiche: FicheResume }) {
  return (
    <Link href={{ pathname: '/fiches/[id]', params: { id: fiche.id } }} asChild>
      <Pressable
        style={styles.carte}
        accessibilityLabel={`${fiche.titre}, ${libellesTypeFiche[fiche.type]}, ${fiche.ageMin} à ${fiche.ageMax} ans, par ${fiche.auteur}`}
      >
        <View>
          <Image source={fiche.image} style={styles.image} contentFit="cover" transition={150} />
          <Text style={styles.etiquette}>{libellesTypeFiche[fiche.type]}</Text>
        </View>
        <Text style={styles.titre} numberOfLines={2}>
          {fiche.titre}
        </Text>
        <Text style={styles.infos}>
          {fiche.ageMin}–{fiche.ageMax} ans · {duree(fiche.dureeMinutes)}
        </Text>
        <View style={styles.auteur}>
          <Avatar pseudo={fiche.auteur} taille={22} />
          <Text style={styles.pseudo} numberOfLines={1}>
            {fiche.auteur}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  carte: { width: 196, gap: 6 },
  image: { height: 220, borderRadius: 20, backgroundColor: couleurs.trait },
  // Étiquette posée sur la photo, sur fond blanc pour rester lisible quelle que soit l'image.
  etiquette: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: couleurs.surface,
    fontFamily: polices.texteGras,
    fontSize: 12,
    color: couleurs.encre,
  },
  // Hauteur fixe de deux lignes : les cartes restent alignées, que le titre soit court ou long.
  titre: {
    height: 42,
    marginTop: 4,
    fontFamily: polices.texteGras,
    fontSize: 16,
    lineHeight: 21,
    color: couleurs.encre,
  },
  infos: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
  auteur: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  pseudo: { flexShrink: 1, fontFamily: polices.texteMoyen, fontSize: 13, color: couleurs.encre2 },
});
