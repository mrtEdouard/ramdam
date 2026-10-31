import { libellesTypeFiche, type FicheResume } from '@ramdam/shared';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';
import { duree } from '@/lib/format';
import { imageDeFiche } from '@/lib/images';

const statuts = {
  BROUILLON: { libelle: 'Brouillon', fond: '#EFEBE5', texte: couleurs.encre2 },
  MASQUEE: { libelle: 'Masquée', fond: couleurs.erreurDoux, texte: couleurs.erreur },
  PUBLIEE: null,
};

// Une fiche dans une liste : la photo à gauche, les informations à droite.
// avecStatut affiche « Brouillon » ou « Masquée » (utile dans « Mes fiches »).
export function LigneFiche({
  fiche,
  avecStatut = false,
}: {
  fiche: FicheResume;
  avecStatut?: boolean;
}) {
  const statut = avecStatut ? statuts[fiche.statut] : null;

  return (
    <Link href={{ pathname: '/fiches/[id]', params: { id: fiche.id } }} asChild>
      <Pressable
        style={styles.ligne}
        accessibilityLabel={`${fiche.titre}, ${libellesTypeFiche[fiche.type]}, ${fiche.ageMin} à ${fiche.ageMax} ans, par ${fiche.auteur}${statut ? `, ${statut.libelle}` : ''}`}
      >
        <Image
          source={imageDeFiche(fiche)}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.textes}>
          <View style={styles.entete}>
            <Text style={styles.type}>{libellesTypeFiche[fiche.type]}</Text>
            {statut && (
              <Text style={[styles.statut, { backgroundColor: statut.fond, color: statut.texte }]}>
                {statut.libelle}
              </Text>
            )}
          </View>
          <Text style={styles.titre} numberOfLines={2}>
            {fiche.titre}
          </Text>
          <View style={styles.infos}>
            <Text style={styles.texteInfo}>
              {fiche.ageMin}–{fiche.ageMax} ans · {duree(fiche.dureeMinutes)} · {fiche.auteur}
            </Text>
            {fiche.aimes > 0 && (
              <View style={styles.aimes}>
                <Heart size={13} color={couleurs.corail} fill={couleurs.corail} />
                <Text style={styles.texteInfo}>{fiche.aimes}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    gap: 14,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  image: { width: 92, height: 92, borderRadius: 14, backgroundColor: couleurs.trait },
  textes: { flex: 1, justifyContent: 'center', gap: 3 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  type: {
    fontFamily: polices.texteGras,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: couleurs.corail,
  },
  statut: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    fontFamily: polices.texteGras,
    fontSize: 11,
  },
  titre: { fontFamily: polices.texteGras, fontSize: 16, lineHeight: 21, color: couleurs.encre },
  infos: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  texteInfo: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
  aimes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
