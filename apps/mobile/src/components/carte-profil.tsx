import { niveauPour, type Profil } from '@ramdam/shared';
import { BadgeCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Embleme } from '@/components/embleme';
import { couleurs, polices } from '@/constants/theme';
import { compteur, moisEtAnnee } from '@/lib/format';

// Le vert du badge Directeur, éclairci pour rester lisible sur la carte sombre.
const VERT_SUR_NUIT = '#93CDAE';

// Carte « nuit » en tête d'un profil : insigne de rang, pseudo, rôle et ancienneté.
// Utilisée pour son propre profil et pour le profil public des autres animateurs.
// children : éléments posés par-dessus la carte (bouton et barème d'XP sur son propre profil).
export function CarteProfil({ profil, children }: { profil: Profil; children?: ReactNode }) {
  const { actuel } = niveauPour(profil.xp);

  return (
    <View style={styles.identite}>
      <View>
        <View accessibilityLabel={`Emblème niveau ${actuel.numero}, ${actuel.nom}`} accessible>
          <Embleme niveau={actuel.numero} taille={220} />
        </View>
        {/* La photo de profil, en médaillon sur l'emblème de rang. */}
        <View style={styles.medaillon}>
          <Avatar pseudo={profil.pseudo} url={profil.avatarUrl} taille={76} />
        </View>
      </View>
      <Text style={styles.rang}>
        Niveau {actuel.numero} · {actuel.nom}
      </Text>
      <Text style={styles.pseudo} accessibilityRole="header">
        {profil.pseudo}
      </Text>
      <View style={styles.ligneRole}>
        {profil.role === 'DIRECTEUR' ? (
          <View style={styles.role}>
            <BadgeCheck size={15} color={VERT_SUR_NUIT} strokeWidth={2} />
            <Text style={[styles.texteRole, { color: VERT_SUR_NUIT }]}>Directeur</Text>
          </View>
        ) : (
          <Text style={styles.texteRole}>Animateur</Text>
        )}
        <Text style={styles.depuis}>
          · membre depuis {moisEtAnnee(new Date(profil.membreDepuis))}
        </Text>
      </View>
      {profil.bio && <Text style={styles.bio}>{profil.bio}</Text>}
      {children}
    </View>
  );
}

// Compteurs publics, comme les abonnés d'un réseau social.
export function CompteursProfil({ profil }: { profil: Profil }) {
  return (
    <View style={styles.compteurs}>
      <Compteur
        valeur={profil.fichesPubliees}
        libelle={profil.fichesPubliees > 1 ? 'activités publiées' : 'activité publiée'}
      />
      <View style={styles.separateurVertical} />
      <Compteur valeur={profil.aimesRecus} libelle="« j’aime » reçus" />
      <View style={styles.separateurVertical} />
      <Compteur valeur={profil.xp} libelle="XP" />
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
  identite: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: couleurs.encre,
  },
  medaillon: {
    position: 'absolute',
    right: 4,
    bottom: 6,
    padding: 3,
    borderRadius: 50,
    backgroundColor: couleurs.encre,
  },
  bio: {
    maxWidth: 420,
    marginTop: 10,
    fontFamily: polices.texte,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: '#E4DDD2',
  },
  rang: {
    fontFamily: polices.texteGras,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#F5C24C',
  },
  pseudo: {
    marginTop: 4,
    fontFamily: polices.titre,
    fontSize: 30,
    letterSpacing: -0.8,
    color: couleurs.surface,
  },
  ligneRole: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  role: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  texteRole: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.surface },
  depuis: { fontFamily: polices.texte, fontSize: 15, color: '#B8AFA3' },
  compteurs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: couleurs.trait,
  },
  compteur: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  valeur: { fontFamily: polices.titre, fontSize: 26, letterSpacing: -0.6, color: couleurs.encre },
  libelle: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2, textAlign: 'center' },
  separateurVertical: { width: 1, alignSelf: 'stretch', backgroundColor: couleurs.trait },
});
