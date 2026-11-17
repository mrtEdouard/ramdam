import type { CibleSignalement, ContenuSignale } from '@ramdam/shared';
import { router } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bouton } from '@/components/bouton';
import { MessageErreur } from '@/components/message-erreur';
import { useToast } from '@/components/toast';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { appeler, ErreurApi } from '@/lib/api';
import { confirmer } from '@/lib/confirmer';
import { depuis } from '@/lib/format';
import { useSession } from '@/session/session-context';

const libellesCible: Record<CibleSignalement, string> = {
  FICHE: 'Fiche',
  COMMENTAIRE: 'Commentaire',
  OFFRE: 'Offre',
};

// Espace de modération (RG-29), réservé aux administrateurs : l'écran est protégé dans
// _layout.tsx et l'API refuse les autres rôles (@Roles('ADMIN')).
export default function Moderation() {
  const { session } = useSession();
  const afficherToast = useToast();
  const requete = useRequete<ContenuSignale[]>('/moderation/signalements');
  // Copie locale : un contenu traité disparaît de la liste sans tout recharger.
  const [contenus, setContenus] = useState<ContenuSignale[] | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (requete.donnees) {
      setContenus(requete.donnees);
    }
  }, [requete.donnees]);

  async function decider(contenu: ContenuSignale, decision: 'MASQUER' | 'IGNORER') {
    if (!session) {
      return;
    }
    if (decision === 'MASQUER') {
      const ok = await confirmer(
        'Masquer ce contenu ?',
        'Il disparaîtra pour tout le monde, sauf pour son auteur.',
        'Masquer',
      );
      if (!ok) {
        return;
      }
    }
    setEnCours(contenu.cibleId);
    setErreur(null);
    try {
      await appeler('PUT', `/moderation/${contenu.cible}/${contenu.cibleId}`, session.jeton, {
        decision,
      });
      setContenus((liste) => liste?.filter((c) => c.cibleId !== contenu.cibleId) ?? null);
      afficherToast(decision === 'MASQUER' ? 'Contenu masqué' : 'Signalement classé');
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : 'La décision n’a pas pu être enregistrée.');
    } finally {
      setEnCours(null);
    }
  }

  function ouvrir(contenu: ContenuSignale) {
    if (contenu.cible === 'OFFRE') {
      router.push({ pathname: '/offres/[id]', params: { id: contenu.cibleId } });
    } else if (contenu.ficheId) {
      // Un commentaire s'ouvre sur sa fiche.
      router.push({ pathname: '/fiches/[id]', params: { id: contenu.ficheId } });
    }
  }

  if (requete.erreur) {
    return (
      <View style={styles.centre}>
        <MessageErreur message={requete.erreur} />
      </View>
    );
  }
  if (!contenus) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={couleurs.corail} accessibilityLabel="Chargement" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.intro} accessibilityLiveRegion="polite">
        {contenus.length === 0
          ? 'Aucun signalement en attente.'
          : `${contenus.length} contenu${contenus.length > 1 ? 's' : ''} à examiner, du plus ancien au plus récent.`}
      </Text>
      {erreur && <MessageErreur message={erreur} />}

      {contenus.map((contenu) => (
        <View key={contenu.cibleId} style={styles.carte}>
          <View style={styles.entete}>
            <Text style={styles.type}>{libellesCible[contenu.cible]}</Text>
            <Text style={styles.nombre}>
              {contenu.signalements.length} signalement
              {contenu.signalements.length > 1 ? 's' : ''}
            </Text>
          </View>

          <Text style={styles.titre}>{contenu.titre}</Text>
          <Text style={styles.auteur}>par {contenu.auteur}</Text>
          <Text style={styles.extrait}>« {contenu.extrait} »</Text>

          <View style={styles.motifs}>
            {contenu.signalements.map((s, position) => (
              <Text key={position} style={styles.motif}>
                <Text style={styles.texteMotif}>{s.motif}</Text>
                {'  '}
                {s.par ?? 'compte supprimé'} · {depuis(new Date(s.le))}
              </Text>
            ))}
          </View>

          <Pressable onPress={() => ouvrir(contenu)} style={styles.voir} accessibilityRole="link">
            <ExternalLink size={16} color={couleurs.encre} />
            <Text style={styles.texteVoir}>
              {contenu.cible === 'COMMENTAIRE' ? 'Voir la fiche commentée' : 'Voir le contenu'}
            </Text>
          </Pressable>

          <View style={styles.boutons}>
            <View style={styles.bouton}>
              <Bouton
                titre="Ignorer"
                variante="secondaire"
                onPress={() => decider(contenu, 'IGNORER')}
              />
            </View>
            <View style={styles.bouton}>
              <Bouton
                titre="Masquer"
                variante="danger"
                onPress={() => decider(contenu, 'MASQUER')}
                chargement={enCours === contenu.cibleId}
              />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
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
    paddingBottom: 48,
  },
  intro: { fontFamily: polices.texteMoyen, fontSize: 15, color: couleurs.encre2 },
  carte: {
    gap: 6,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  type: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: couleurs.sapinDoux,
    fontFamily: polices.texteGras,
    fontSize: 12,
    color: couleurs.sapin,
  },
  nombre: { fontFamily: polices.texteGras, fontSize: 13, color: couleurs.erreur },
  titre: { fontFamily: polices.titre, fontSize: 19, letterSpacing: -0.3, color: couleurs.encre },
  auteur: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.encre2 },
  extrait: {
    fontFamily: polices.texte,
    fontSize: 15,
    lineHeight: 21,
    fontStyle: 'italic',
    color: couleurs.encre,
  },
  motifs: {
    gap: 4,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: couleurs.trait,
  },
  motif: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
  texteMotif: { fontFamily: polices.texteGras, color: couleurs.encre },
  voir: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, minHeight: 36 },
  texteVoir: {
    fontFamily: polices.texteGras,
    fontSize: 14,
    color: couleurs.encre,
    textDecorationLine: 'underline',
  },
  boutons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  bouton: { flex: 1 },
});
