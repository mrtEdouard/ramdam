import { libelleType, type EtatAime, type FicheDetail } from '@ramdam/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Bookmark, BookmarkCheck, Clock, Heart, Smile, Users, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar } from '@/components/avatar';
import { Bouton } from '@/components/bouton';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useToast } from '@/components/toast';
import { useRequete } from '@/hooks/use-requete';
import { appeler, ErreurApi } from '@/lib/api';
import { confirmer } from '@/lib/confirmer';
import { depuis, duree } from '@/lib/format';
import { adresseImage, imageDeFiche } from '@/lib/images';
import { useSession } from '@/session/session-context';

export default function DetailFiche() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { donnees: fiche, erreur, recharger } = useRequete<FicheDetail>(`/fiches/${id}`);
  const [action, setAction] = useState<'publier' | 'supprimer' | null>(null);
  // Réponses de l'API après un « j'aime » ou un ajout à la Malle : elles remplacent
  // les valeurs de la fiche chargée, sans avoir à la recharger en entier.
  const [etatAime, setEtatAime] = useState<EtatAime | null>(null);
  const [dansLaMalle, setDansLaMalle] = useState<boolean | null>(null);
  const afficherToast = useToast();
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  // Photo de la galerie affichée en grand, ou null.
  const [photoOuverte, setPhotoOuverte] = useState<string | null>(null);

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

  const aimes = etatAime?.aimes ?? fiche.aimes;
  const aimeeParMoi = etatAime?.aimeeParMoi ?? fiche.aimeeParMoi;
  const dansMaMalle = dansLaMalle ?? fiche.dansMaMalle;

  // Le bouton change tout de suite (mise à jour « optimiste ») ; si l'API refuse,
  // on revient à l'état précédent et on affiche le message.
  async function basculerAime() {
    const precedent = { aimes, aimeeParMoi, xpGagne: 0 };
    setEtatAime({ aimes: aimes + (aimeeParMoi ? -1 : 1), aimeeParMoi: !aimeeParMoi, xpGagne: 0 });
    try {
      const etat = await appeler<EtatAime>(
        aimeeParMoi ? 'DELETE' : 'PUT',
        `/fiches/${id}/aime`,
        session!.jeton,
      );
      setEtatAime(etat);
      if (etat.xpGagne > 0) {
        afficherToast(`+${etat.xpGagne} XP pour avoir aimé cette fiche`);
      }
    } catch (e) {
      setEtatAime(precedent);
      setErreurAction(
        e instanceof ErreurApi ? e.message : 'Impossible d’enregistrer ton « j’aime ».',
      );
    }
  }

  async function basculerMalle() {
    setDansLaMalle(!dansMaMalle);
    try {
      await appeler(dansMaMalle ? 'DELETE' : 'PUT', `/fiches/${id}/malle`, session!.jeton);
    } catch (e) {
      setDansLaMalle(dansMaMalle);
      setErreurAction(e instanceof ErreurApi ? e.message : 'Impossible de modifier ta Malle.');
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
          <Text style={styles.type}>{libelleType(fiche)}</Text>
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
          {fiche.estAuteur && (
            <View style={styles.aimes} accessibilityLabel={`${aimes} j'aime`}>
              <Heart
                size={18}
                color={couleurs.corail}
                fill={aimes > 0 ? couleurs.corail : 'none'}
              />
              <Text style={styles.nombreAimes}>{aimes}</Text>
            </View>
          )}
        </View>

        {/* On aime et on garde les fiches des autres, pas les siennes. */}
        {!fiche.estAuteur && (
          <View style={styles.reactions}>
            <Pressable
              onPress={basculerAime}
              style={[styles.reaction, aimeeParMoi && styles.reactionActive]}
              accessibilityRole="button"
              aria-selected={aimeeParMoi}
              accessibilityLabel={`${aimeeParMoi ? 'Retirer mon j’aime' : 'J’aime'}, ${aimes} j’aime`}
            >
              <Heart
                size={20}
                color={couleurs.corail}
                fill={aimeeParMoi ? couleurs.corail : 'none'}
                strokeWidth={2}
              />
              <Text style={styles.texteReaction}>{aimes}</Text>
            </Pressable>
            <Pressable
              onPress={basculerMalle}
              style={[styles.reaction, styles.reactionMalle, dansMaMalle && styles.reactionActive]}
              accessibilityRole="button"
              aria-selected={dansMaMalle}
            >
              {dansMaMalle ? (
                <BookmarkCheck size={20} color={couleurs.corail} strokeWidth={2} />
              ) : (
                <Bookmark size={20} color={couleurs.encre} strokeWidth={2} />
              )}
              <Text style={styles.texteReaction}>
                {dansMaMalle ? 'Dans ma Malle' : 'Garder dans ma Malle'}
              </Text>
            </Pressable>
          </View>
        )}
        {!fiche.estAuteur && erreurAction && <MessageErreur message={erreurAction} />}

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

        {fiche.objectifs.length > 0 && (
          <Section titre="Objectifs">
            <Bulles mots={fiche.objectifs} style={styles.bulleObjectif} />
          </Section>
        )}
        {fiche.materiel.length > 0 && (
          <Section titre="Matériel">
            <Bulles mots={fiche.materiel} style={styles.bulleMateriel} />
          </Section>
        )}
        <Section titre="Déroulement">
          <Text style={styles.texte}>{fiche.deroulement}</Text>
        </Section>

        {fiche.photos.length > 0 && (
          <Section titre={`Galerie (${fiche.photos.length})`}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galerie}
            >
              {fiche.photos.map((photo, position) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setPhotoOuverte(photo.url)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Agrandir la photo ${position + 1}`}
                >
                  <Image
                    source={adresseImage(photo.url)}
                    style={styles.vignette}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </Section>
        )}

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

      {/* Photo de la galerie en plein écran ; un appui n'importe où la referme. */}
      <Modal
        visible={photoOuverte !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoOuverte(null)}
      >
        <Pressable
          style={styles.plein}
          onPress={() => setPhotoOuverte(null)}
          accessibilityLabel="Fermer la photo"
        >
          {photoOuverte && (
            <Image
              source={adresseImage(photoOuverte)}
              style={styles.photoPleine}
              contentFit="contain"
            />
          )}
          <View style={styles.fermer}>
            <X size={22} color={couleurs.surface} />
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Bulles({ mots, style }: { mots: string[]; style: object }) {
  return (
    <View style={styles.bulles}>
      {mots.map((mot) => (
        <Text key={mot} style={[styles.bulle, style]}>
          {mot}
        </Text>
      ))}
    </View>
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

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.titreSection} accessibilityRole="header">
        {titre}
      </Text>
      {children}
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
  reactions: { flexDirection: 'row', gap: 10 },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  reactionMalle: { flex: 1 },
  reactionActive: { borderColor: couleurs.corail, backgroundColor: couleurs.corailDoux },
  texteReaction: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
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
  bulles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bulle: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    fontFamily: polices.texteMoyen,
    fontSize: 14,
    color: couleurs.encre,
  },
  bulleMateriel: { borderWidth: 1, borderColor: couleurs.trait, backgroundColor: couleurs.surface },
  bulleObjectif: { backgroundColor: couleurs.corailDoux },
  galerie: { gap: 10 },
  vignette: { width: 120, height: 120, borderRadius: 16, backgroundColor: couleurs.trait },
  plein: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 14, 25, 0.95)',
  },
  photoPleine: { width: '100%', height: '80%' },
  fermer: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
