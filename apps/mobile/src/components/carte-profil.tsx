import { niveauPour, type Profil } from '@ramdam/shared';
import { BadgeCheck, Info } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Embleme } from '@/components/embleme';
import { couleurs, polices } from '@/constants/theme';
import { compteur, moisEtAnnee } from '@/lib/format';

type Props = {
  profil: Profil;
  // Sur son propre profil : un appui sur la ligne du niveau affiche le barème d'XP.
  surNiveau?: () => void;
};

// En-tête d'un profil, à la manière d'un réseau social : la photo et les compteurs
// sur une ligne, puis le pseudo, le rôle, le niveau et la bio.
// Utilisé pour son propre profil et pour le profil public des autres animateurs.
export function CarteProfil({ profil, surNiveau }: Props) {
  const { actuel } = niveauPour(profil.xp);
  const niveau = `Niveau ${actuel.numero} · ${actuel.nom}`;

  return (
    <View style={styles.entete}>
      <View style={styles.ligne}>
        {/* La photo dans un anneau ; l'emblème du rang posé dessus, comme un badge. */}
        <View>
          <View style={styles.anneau}>
            <Avatar pseudo={profil.pseudo} url={profil.avatarUrl} taille={84} />
          </View>
          <View
            style={styles.embleme}
            accessible
            accessibilityLabel={`Emblème niveau ${actuel.numero}, ${actuel.nom}`}
          >
            <Embleme niveau={actuel.numero} taille={46} />
          </View>
        </View>

        <View style={styles.compteurs}>
          <Compteur
            valeur={profil.fichesPubliees}
            libelle={profil.fichesPubliees > 1 ? 'activités' : 'activité'}
          />
          <Compteur valeur={profil.aimesRecus} libelle="j’aime" />
          <Compteur valeur={profil.xp} libelle="XP" />
        </View>
      </View>

      <View style={styles.identite}>
        <View style={styles.lignePseudo}>
          <Text style={styles.pseudo} accessibilityRole="header">
            {profil.pseudo}
          </Text>
          {profil.role === 'DIRECTEUR' && (
            <View style={styles.badge}>
              <BadgeCheck size={14} color={couleurs.succes} strokeWidth={2.2} />
              <Text style={styles.texteBadge}>Directeur</Text>
            </View>
          )}
        </View>

        {surNiveau ? (
          <Pressable
            onPress={surNiveau}
            style={styles.ligneNiveau}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${niveau}. Comment gagner de l’XP`}
          >
            <Text style={styles.niveau}>{niveau}</Text>
            <Info size={15} color={couleurs.encre3} strokeWidth={2} />
          </Pressable>
        ) : (
          <Text style={styles.niveau}>{niveau}</Text>
        )}

        {profil.bio && <Text style={styles.bio}>{profil.bio}</Text>}

        <Text style={styles.depuis}>
          {/* Le badge dit déjà « Directeur » : on ne le répète pas ici. */}
          {profil.role === 'DIRECTEUR' ? 'Membre' : 'Animateur · membre'} depuis{' '}
          {moisEtAnnee(new Date(profil.membreDepuis))}
        </Text>
      </View>
    </View>
  );
}

function Compteur({ valeur, libelle }: { valeur: number; libelle: string }) {
  return (
    <View style={styles.compteur} accessible accessibilityLabel={`${valeur} ${libelle}`}>
      <Text style={styles.valeur}>{compteur(valeur)}</Text>
      <Text style={styles.libelle}>{libelle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  entete: { gap: 14, paddingTop: 4 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  // Un fin cercle corail, séparé de la photo par un liseré couleur papier.
  anneau: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: couleurs.corail,
  },
  embleme: { position: 'absolute', right: -12, bottom: -8 },
  compteurs: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  compteur: { alignItems: 'center', gap: 1, paddingHorizontal: 2 },
  valeur: { fontFamily: polices.titre, fontSize: 22, letterSpacing: -0.5, color: couleurs.encre },
  libelle: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
  identite: { gap: 4 },
  lignePseudo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  pseudo: {
    fontFamily: polices.titre,
    fontSize: 22,
    letterSpacing: -0.5,
    color: couleurs.encre,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: couleurs.sapinDoux,
  },
  texteBadge: { fontFamily: polices.texteGras, fontSize: 12, color: couleurs.succes },
  ligneNiveau: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  niveau: {
    fontFamily: polices.texteGras,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: couleurs.corail,
  },
  bio: {
    marginTop: 4,
    fontFamily: polices.texte,
    fontSize: 15,
    lineHeight: 21,
    color: couleurs.encre,
  },
  depuis: { marginTop: 2, fontFamily: polices.texte, fontSize: 13, color: couleurs.encre3 },
});
