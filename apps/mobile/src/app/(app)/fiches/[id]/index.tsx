import { libellesTypeFiche, type FicheDetail } from '@ramdam/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock, Heart, Smile, Users } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Bouton } from '@/components/bouton';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { appeler, ErreurApi } from '@/lib/api';
import { confirmer } from '@/lib/confirmer';
import { depuis, duree } from '@/lib/format';
import { imageDeFiche } from '@/lib/images';
import { useSession } from '@/session/session-context';

export default function DetailFiche() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { donnees: fiche, erreur, recharger } = useRequete<FicheDetail>(`/fiches/${id}`);
  const [action, setAction] = useState<'publier' | 'supprimer' | null>(null);
  const [erreurAction, setErreurAction] = useState<string | null>(null);

  if (erreur) {
    return (
      <View style={styles.centre}>
        <MessageErreur message={erreur} />
      </View>
    );
  }
  if (!fiche || !session) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={couleurs.corail} accessibilityLabel="Chargement de la fiche" />
      </View>
    );
  }

  async function publier() {
    setAction('publier');
    try {
      await appeler('PATCH', `/fiches/${id}`, session!.jeton, { publier: true });
      await recharger();
    } catch (e) {
      setErreurAction(e instanceof ErreurApi ? e.message : 'Impossible de publier la fiche.');
    } finally {
      setAction(null);
    }
  }

  async function supprimer() {
    const ok = await confirmer(
      'Supprimer cette fiche ?',
      'Elle disparaîtra pour tout le monde. C’est définitif.',
      'Supprimer',
    );
    if (!ok) {
      return;
    }
    setAction('supprimer');
    try {
      await appeler('DELETE', `/fiches/${id}`, session!.jeton);
      // Retour à l'écran précédent ; ouvert par un lien direct, il n'y en a pas : on va à la Malle.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/malle');
      }
    } catch (e) {
      setErreurAction(e instanceof ErreurApi ? e.message : 'Impossible de supprimer la fiche.');
      setAction(null);
    }
  }

  const participants =
    fiche.nbParticipantsMin && fiche.nbParticipantsMax
      ? `${fiche.nbParticipantsMin} à ${fiche.nbParticipantsMax}`
      : fiche.nbParticipantsMin
        ? `${fiche.nbParticipantsMin} et plus`
        : fiche.nbParticipantsMax
          ? `jusqu’à ${fiche.nbParticipantsMax}`
          : null;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Image
        source={imageDeFiche(fiche)}
        style={styles.image}
        contentFit="cover"
        transition={150}
      />

      <View style={styles.contenu}>
        <View style={styles.ligneType}>
          <Text style={styles.type}>{libellesTypeFiche[fiche.type]}</Text>
          {fiche.statut === 'BROUILLON' && <Text style={styles.brouillon}>Brouillon</Text>}
          {fiche.statut === 'MASQUEE' && (
            <Text style={styles.masquee}>Masquée par la modération</Text>
          )}
        </View>
        <Text style={styles.titre} accessibilityRole="header">
          {fiche.titre}
        </Text>

        <View style={styles.auteur}>
          <Avatar pseudo={fiche.auteur} taille={32} />
          <Text style={styles.pseudo}>{fiche.auteur}</Text>
          {fiche.publieeLe && (
            <Text style={styles.date}>· {depuis(new Date(fiche.publieeLe))}</Text>
          )}
          <View style={styles.aimes} accessibilityLabel={`${fiche.aimes} j'aime`}>
            <Heart
              size={18}
              color={couleurs.corail}
              fill={fiche.aimes > 0 ? couleurs.corail : 'none'}
            />
            <Text style={styles.nombreAimes}>{fiche.aimes}</Text>
          </View>
        </View>

        <View style={styles.infos}>
          <Info
            icone={<Smile size={18} color={couleurs.corail} />}
            libelle="Âges"
            valeur={`${fiche.ageMin} à ${fiche.ageMax} ans`}
          />
          <Info
            icone={<Clock size={18} color={couleurs.corail} />}
            libelle="Durée"
            valeur={duree(fiche.dureeMinutes)}
          />
          {participants && (
            <Info
              icone={<Users size={18} color={couleurs.corail} />}
              libelle="Participants"
              valeur={participants}
            />
          )}
        </View>

        {fiche.objectifs && <Section titre="Objectifs" texte={fiche.objectifs} />}
        {fiche.materiel && <Section titre="Matériel" texte={fiche.materiel} />}
        <Section titre="Déroulement" texte={fiche.deroulement} />

        {/* Actions réservées à l'auteur (RG-06). L'API vérifie aussi : ce n'est qu'un affichage. */}
        {fiche.estAuteur && (
          <View style={styles.actions}>
            {erreurAction && <MessageErreur message={erreurAction} />}
            {fiche.statut === 'BROUILLON' && (
              <Bouton
                titre="Publier la fiche"
                onPress={publier}
                chargement={action === 'publier'}
              />
            )}
            <Bouton
              titre="Modifier"
              variante="secondaire"
              onPress={() =>
                router.push({ pathname: '/fiches/[id]/modifier', params: { id: fiche.id } })
              }
            />
            <Bouton
              titre="Supprimer"
              variante="danger"
              onPress={supprimer}
              chargement={action === 'supprimer'}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Info({ icone, libelle, valeur }: { icone: ReactNode; libelle: string; valeur: string }) {
  return (
    <View style={styles.info} accessible accessibilityLabel={`${libelle} : ${valeur}`}>
      {icone}
      <Text style={styles.libelleInfo}>{libelle}</Text>
      <Text style={styles.valeurInfo}>{valeur}</Text>
    </View>
  );
}

function Section({ titre, texte }: { titre: string; texte: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.titreSection} accessibilityRole="header">
        {titre}
      </Text>
      <Text style={styles.texte}>{texte}</Text>
    </View>
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
  page: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingBottom: 40 },
  image: { height: 260, backgroundColor: couleurs.trait },
  contenu: { gap: 18, padding: 20 },
  ligneType: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  type: {
    fontFamily: polices.texteGras,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: couleurs.corail,
  },
  brouillon: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFEBE5',
    fontFamily: polices.texteGras,
    fontSize: 12,
    color: couleurs.encre2,
  },
  masquee: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: couleurs.erreurDoux,
    fontFamily: polices.texteGras,
    fontSize: 12,
    color: couleurs.erreur,
  },
  titre: {
    marginTop: -8,
    fontFamily: polices.titre,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
    color: couleurs.encre,
  },
  auteur: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pseudo: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  date: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
  aimes: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' },
  nombreAimes: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  infos: { flexDirection: 'row', gap: 10 },
  info: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  libelleInfo: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
  valeurInfo: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  section: { gap: 6 },
  titreSection: {
    fontFamily: polices.titre,
    fontSize: 19,
    letterSpacing: -0.4,
    color: couleurs.encre,
  },
  texte: { fontFamily: polices.texte, fontSize: 16, lineHeight: 24, color: couleurs.encre },
  actions: { gap: 10, marginTop: 8 },
});
