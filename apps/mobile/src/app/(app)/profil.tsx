import { niveauPour, niveaux, type Profil } from '@ramdam/shared';
import { useFocusEffect } from 'expo-router';
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  LogOut,
  X,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { Embleme } from '@/components/embleme';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { ErreurApi, lire } from '@/lib/api';
import { compteur, moisEtAnnee } from '@/lib/format';
import { useSession } from '@/session/session-context';

// Le vert du badge Directeur, éclairci pour rester lisible sur la carte sombre.
const VERT_SUR_NUIT = '#4FD1A5';

// Les gains d'XP fixés par les triggers de la base (database/01_schema.sql).
const gainsXp = [
  { action: 'Publier une fiche', points: 50 },
  { action: 'Ta fiche est ajoutée à une Malle', points: 10 },
  { action: 'Commenter une fiche', points: 5 },
  { action: 'Ta fiche reçoit un « j’aime »', points: 2 },
];

export default function PageProfil() {
  const { session, deconnecter } = useSession();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [baremeVisible, setBaremeVisible] = useState(false);
  const [niveauxVisibles, setNiveauxVisibles] = useState(false);

  // Recharge le profil à chaque ouverture de l'écran : l'XP a pu changer entre-temps.
  useFocusEffect(
    useCallback(() => {
      if (!session) {
        return;
      }
      lire<Profil>('/profils/moi', session.jeton)
        .then((donnees) => {
          setProfil(donnees);
          setErreur(null);
        })
        .catch((e) => {
          // Jeton expiré ou refusé : on renvoie vers la connexion.
          if (e instanceof ErreurApi && e.statut === 401) {
            deconnecter();
            return;
          }
          setErreur(e instanceof ErreurApi ? e.message : 'Impossible de charger le profil.');
        });
    }, [session, deconnecter]),
  );

  if (erreur) {
    return (
      <View style={styles.centre}>
        <MessageErreur message={erreur} />
      </View>
    );
  }
  if (!profil) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={couleurs.corail} accessibilityLabel="Chargement du profil" />
      </View>
    );
  }

  const { actuel, suivant, progression, xpRestants } = niveauPour(profil.xp);

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.identite}>
        <View accessibilityLabel={`Emblème niveau ${actuel.numero}, ${actuel.nom}`} accessible>
          <Embleme niveau={actuel.numero} taille={220} />
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

        <Pressable
          onPress={() => setBaremeVisible(true)}
          style={styles.boutonInfo}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Comment gagner de l’XP"
        >
          <Info size={20} color="#B9B6C8" strokeWidth={2} />
        </Pressable>

        {/* Le barème s'ouvre par-dessus la carte, sans quitter le profil. */}
        {baremeVisible && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(150)}
            style={styles.bareme}
          >
            <View style={styles.enteteBareme}>
              <Text style={styles.titreBareme} accessibilityRole="header">
                Gagner de l’XP
              </Text>
              <Pressable
                onPress={() => setBaremeVisible(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Fermer le barème"
              >
                <X size={22} color={couleurs.surface} strokeWidth={2} />
              </Pressable>
            </View>
            {gainsXp.map(({ action, points }) => (
              <View key={action} style={styles.ligneGain}>
                <Text style={styles.action}>{action}</Text>
                <Text style={styles.points}>+{points} XP</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </View>

      {/* Compteurs publics, comme les abonnés d'un réseau social. */}
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

      {/* Un appui sur la barre d'expérience déplie la liste des niveaux. */}
      <Pressable
        onPress={() => setNiveauxVisibles(!niveauxVisibles)}
        style={styles.carte}
        accessibilityRole="button"
        aria-expanded={niveauxVisibles}
        accessibilityLabel={`Niveau ${actuel.numero}, ${actuel.nom}. ${niveauxVisibles ? 'Masquer' : 'Afficher'} la liste des niveaux`}
      >
        <View style={styles.enteteNiveau}>
          <Text style={styles.numeroNiveau}>Niveau {actuel.numero}</Text>
          <Text style={styles.nomNiveau}>{actuel.nom}</Text>
          {niveauxVisibles ? (
            <ChevronUp size={20} color={couleurs.encre2} style={styles.chevron} />
          ) : (
            <ChevronDown size={20} color={couleurs.encre2} style={styles.chevron} />
          )}
        </View>
        <View
          style={styles.barre}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progression * 100) }}
        >
          <View style={[styles.remplissage, { width: `${Math.max(progression * 100, 3)}%` }]} />
        </View>
        <Text style={styles.texteProgression}>
          {suivant
            ? `Encore ${xpRestants} XP pour devenir ${suivant.nom}`
            : 'Niveau maximum : tu fais partie des légendes.'}
        </Text>

        {niveauxVisibles && (
          <Animated.View entering={FadeInUp.duration(220)} style={styles.listeNiveaux}>
            {niveaux.map((niveau, position) => {
              const atteint = niveau.numero <= actuel.numero;
              const enCours = niveau.numero === actuel.numero;
              return (
                <View key={niveau.numero}>
                  {position > 0 && <View style={styles.separateur} />}
                  <View style={styles.ligneNiveau}>
                    <Embleme niveau={niveau.numero} taille={52} verrouille={!atteint} />
                    <View style={styles.textesNiveau}>
                      <Text style={[styles.nomListe, !atteint && styles.texteVerrouille]}>
                        {niveau.numero}. {niveau.nom}
                      </Text>
                      <Text style={styles.seuil}>
                        {niveau.xpMin === 0 ? 'Au départ' : `Dès ${niveau.xpMin} XP`}
                      </Text>
                    </View>
                    {enCours ? (
                      <Text style={styles.toi}>Toi</Text>
                    ) : atteint ? (
                      <Check
                        size={20}
                        color={couleurs.succes}
                        strokeWidth={2.5}
                        accessibilityLabel="Atteint"
                      />
                    ) : (
                      <Lock
                        size={18}
                        color={couleurs.encre3}
                        strokeWidth={2}
                        accessibilityLabel="Verrouillé"
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}
      </Pressable>

      <Pressable onPress={deconnecter} style={styles.deconnexion} accessibilityRole="button">
        <LogOut size={20} color={couleurs.erreur} strokeWidth={2} />
        <Text style={styles.texteDeconnexion}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
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
  centre: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Carte « nuit » en tête du profil : les insignes de rang brillent sur un fond sombre.
  identite: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: couleurs.encre,
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
  depuis: { fontFamily: polices.texte, fontSize: 15, color: '#B9B6C8' },
  compteurs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  compteur: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  valeur: { fontFamily: polices.titre, fontSize: 26, letterSpacing: -0.6, color: couleurs.encre },
  libelle: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2, textAlign: 'center' },
  separateurVertical: { width: 1, alignSelf: 'stretch', backgroundColor: couleurs.trait },
  carte: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  enteteNiveau: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  chevron: { marginLeft: 'auto', alignSelf: 'center' },
  listeNiveaux: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: couleurs.trait,
  },
  numeroNiveau: { fontFamily: polices.texteGras, fontSize: 14, color: couleurs.corail },
  nomNiveau: {
    fontFamily: polices.titre,
    fontSize: 20,
    letterSpacing: -0.4,
    color: couleurs.encre,
  },
  barre: { height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: couleurs.corailDoux },
  remplissage: { height: '100%', borderRadius: 5, backgroundColor: couleurs.corail },
  texteProgression: {
    marginTop: 10,
    fontFamily: polices.texte,
    fontSize: 14,
    color: couleurs.encre2,
  },
  ligneNiveau: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  textesNiveau: { flex: 1, gap: 2 },
  nomListe: { fontFamily: polices.texteGras, fontSize: 16, color: couleurs.encre },
  texteVerrouille: { color: couleurs.encre2 },
  seuil: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
  toi: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: couleurs.corail,
    fontFamily: polices.texteGras,
    fontSize: 13,
    color: couleurs.surface,
  },
  separateur: { height: 1, marginVertical: 6, backgroundColor: couleurs.trait },
  boutonInfo: { position: 'absolute', top: 14, right: 14, padding: 4 },
  // Panneau du barème, posé sur toute la carte sombre.
  bareme: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    gap: 6,
    padding: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 14, 25, 0.97)',
  },
  enteteBareme: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titreBareme: {
    fontFamily: polices.titre,
    fontSize: 22,
    letterSpacing: -0.5,
    color: couleurs.surface,
  },
  ligneGain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  action: { flex: 1, fontFamily: polices.texte, fontSize: 15, color: couleurs.surface },
  points: { fontFamily: polices.texteGras, fontSize: 15, color: '#F5C24C' },
  deconnexion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  texteDeconnexion: { fontFamily: polices.texteGras, fontSize: 16, color: couleurs.erreur },
});
