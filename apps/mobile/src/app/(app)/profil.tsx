import { niveauPour, niveaux, raisonXp, type MouvementXp, type Profil } from '@ramdam/shared';
import { useFocusEffect } from 'expo-router';
import { Check, ChevronDown, ChevronUp, Info, Lock, LogOut, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { CarteProfil, CompteursProfil } from '@/components/carte-profil';
import { Embleme } from '@/components/embleme';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { ErreurApi, lire } from '@/lib/api';
import { depuis } from '@/lib/format';
import { useSession } from '@/session/session-context';

// Les gains d'XP fixés par les triggers de la base (database/01_schema.sql).
const gainsXp = [
  { action: 'Publier une fiche', points: 50 },
  { action: 'Ta fiche est ajoutée à une Malle', points: 10 },
  { action: 'Commenter une fiche', points: 5 },
  { action: 'Ta fiche reçoit un « j’aime »', points: 2 },
  { action: 'Aimer la fiche d’un autre (10 fois par jour)', points: 1 },
];

export default function PageProfil() {
  const { session, deconnecter } = useSession();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [historique, setHistorique] = useState<MouvementXp[]>([]);
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
      // L'historique est privé : la route ne renvoie que celui du compte connecté.
      lire<MouvementXp[]>('/profils/moi/historique-xp', session.jeton)
        .then(setHistorique)
        .catch(() => setHistorique([]));
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
      <CarteProfil profil={profil}>
        <Pressable
          onPress={() => setBaremeVisible(true)}
          style={styles.boutonInfo}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Comment gagner de l’XP"
        >
          <Info size={20} color="#B8AFA3" strokeWidth={2} />
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
      </CarteProfil>

      <CompteursProfil profil={profil} />

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

      <View style={styles.carte}>
        <Text style={styles.titreHistorique} accessibilityRole="header">
          Derniers gains d’XP
        </Text>
        {historique.length === 0 ? (
          <Text style={styles.seuil}>Pas encore d’XP gagnée : publie ou aime une fiche !</Text>
        ) : (
          historique.map((mouvement, position) => (
            <View key={mouvement.id}>
              {position > 0 && <View style={styles.separateur} />}
              <View style={styles.ligneHistorique}>
                <View style={styles.textesNiveau}>
                  <Text style={styles.raison}>{raisonXp(mouvement)}</Text>
                  <Text style={styles.seuil}>{depuis(new Date(mouvement.gagneLe))}</Text>
                </View>
                <Text style={styles.gain}>+{mouvement.points} XP</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Pressable onPress={deconnecter} style={styles.deconnexion} accessibilityRole="button">
        <LogOut size={20} color={couleurs.erreur} strokeWidth={2} />
        <Text style={styles.texteDeconnexion}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
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
  // Sections à plat, sans boîte : le titre et les traits suffisent à les séparer.
  carte: { paddingVertical: 4 },
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
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: couleurs.corail,
    fontFamily: polices.texteGras,
    fontSize: 13,
    color: couleurs.surface,
  },
  titreHistorique: {
    marginBottom: 8,
    fontFamily: polices.titre,
    fontSize: 18,
    letterSpacing: -0.3,
    color: couleurs.encre,
  },
  ligneHistorique: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  raison: { fontFamily: polices.texte, fontSize: 15, color: couleurs.encre },
  gain: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.corail },
  separateur: { height: 1, marginVertical: 6, backgroundColor: couleurs.trait },
  boutonInfo: { position: 'absolute', top: 14, right: 14, padding: 4 },
  // Panneau du barème, posé sur toute la carte sombre.
  bareme: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    gap: 6,
    padding: 24,
    borderRadius: 14,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  texteDeconnexion: { fontFamily: polices.texteGras, fontSize: 16, color: couleurs.erreur },
});
