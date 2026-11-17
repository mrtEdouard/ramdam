import { libellesTypeStructure, type OffreDetail } from '@ramdam/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, CalendarDays, GraduationCap, MapPin } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bouton } from '@/components/bouton';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { appeler, ErreurApi } from '@/lib/api';
import { confirmer } from '@/lib/confirmer';
import { adresseImage } from '@/lib/images';
import { periode } from '@/lib/format';
import { useSession } from '@/session/session-context';

export default function DetailOffre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { donnees: offre, erreur, recharger } = useRequete<OffreDetail>(`/offres/${id}`);
  const [action, setAction] = useState<'statut' | 'supprimer' | null>(null);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  // Photo affichée en grand, ou null.
  const [photoOuverte, setPhotoOuverte] = useState<string | null>(null);

  if (erreur) {
    return (
      <View style={styles.centre}>
        <MessageErreur message={erreur} />
      </View>
    );
  }
  if (!offre) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={couleurs.corail} accessibilityLabel="Chargement de l'offre" />
      </View>
    );
  }

  const cloturee = offre.statut === 'CLOTUREE';
  // Les candidatures se font hors de Ramdam : on ouvre l'e-mail ou le site de la structure.
  const estEmail = !offre.contactExterne.startsWith('http');
  const lienContact = estEmail ? `mailto:${offre.contactExterne}` : offre.contactExterne;

  // Clôturer quand le poste est pourvu (l'offre quitte la liste), ou rouvrir.
  async function basculerStatut() {
    setAction('statut');
    setErreurAction(null);
    try {
      await appeler(cloturee ? 'DELETE' : 'PUT', `/offres/${id}/cloture`, session!.jeton);
      await recharger();
    } catch (e) {
      setErreurAction(e instanceof ErreurApi ? e.message : 'Impossible de changer le statut.');
    } finally {
      setAction(null);
    }
  }

  async function supprimer() {
    const ok = await confirmer(
      'Supprimer cette offre ?',
      'Elle disparaîtra pour tout le monde. C’est définitif.',
      'Supprimer',
    );
    if (!ok) {
      return;
    }
    setAction('supprimer');
    try {
      await appeler('DELETE', `/offres/${id}`, session!.jeton);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/offres');
      }
    } catch (e) {
      setErreurAction(e instanceof ErreurApi ? e.message : 'Impossible de supprimer l’offre.');
      setAction(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {/* Photos du séjour : une bande qui défile ; un appui agrandit la photo. */}
      {offre.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horsMarge}
          contentContainerStyle={styles.photos}
        >
          {offre.photos.map((photo, position) => (
            <Pressable
              key={photo.id}
              onPress={() => setPhotoOuverte(photo.url)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Agrandir la photo ${position + 1} sur ${offre.photos.length}`}
            >
              <Image
                source={adresseImage(photo.url)}
                style={[styles.photo, offre.photos.length === 1 && styles.photoSeule]}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {cloturee && (
        <Text style={styles.bandeau}>
          Offre clôturée : le poste est pourvu, elle n’apparaît plus dans la liste.
        </Text>
      )}
      <Text style={styles.structure}>
        {libellesTypeStructure[offre.typeStructure]} · {offre.structure}
      </Text>
      <Text style={styles.titre} accessibilityRole="header">
        {offre.intitule}
      </Text>
      <View style={styles.directeur}>
        <BadgeCheck size={16} color={couleurs.succes} strokeWidth={2} />
        <Text style={styles.texteDirecteur}>Publiée par {offre.directeur}, Directeur</Text>
      </View>

      <View style={styles.infos}>
        <Info icone={<MapPin size={18} color={couleurs.encre2} />} texte={offre.region} />
        <Info
          icone={<CalendarDays size={18} color={couleurs.encre2} />}
          texte={periode(new Date(offre.dateDebut), new Date(offre.dateFin))}
        />
        <Info
          icone={<GraduationCap size={18} color={couleurs.encre2} />}
          texte={
            offre.diplomeRequis
              ? `Diplôme demandé : ${offre.diplomeRequis}`
              : 'Pas de diplôme demandé'
          }
        />
      </View>

      <Text style={styles.titreSection} accessibilityRole="header">
        Le poste
      </Text>
      <Text style={styles.texte}>{offre.description}</Text>

      {!cloturee && !offre.estAMoi && (
        <>
          <Bouton
            titre={estEmail ? 'Candidater par e-mail' : 'Candidater sur le site'}
            onPress={() => Linking.openURL(lienContact)}
          />
          <Text style={styles.note}>
            La candidature se fait directement auprès de la structure.
          </Text>
        </>
      )}

      {/* Actions du Directeur qui a publié l'offre. L'API vérifie aussi : ce n'est qu'un affichage. */}
      {offre.estAMoi && (
        <View style={styles.actions}>
          {erreurAction && <MessageErreur message={erreurAction} />}
          <Bouton
            titre="Modifier"
            variante="secondaire"
            onPress={() =>
              router.push({ pathname: '/offres/[id]/modifier', params: { id: offre.id } })
            }
          />
          <Bouton
            titre={cloturee ? 'Rouvrir l’offre' : 'Clôturer : poste pourvu'}
            variante="secondaire"
            onPress={basculerStatut}
            chargement={action === 'statut'}
          />
          <Bouton
            titre="Supprimer"
            variante="danger"
            onPress={supprimer}
            chargement={action === 'supprimer'}
          />
        </View>
      )}

      <Modal
        visible={photoOuverte !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoOuverte(null)}
      >
        <Pressable
          style={styles.voile}
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
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Info({ icone, texte }: { icone: ReactNode; texte: string }) {
  return (
    <View style={styles.info}>
      {icone}
      <Text style={styles.texteInfo}>{texte}</Text>
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
  page: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  horsMarge: { marginHorizontal: -20, marginTop: -4 },
  photos: { gap: 8, paddingHorizontal: 20 },
  photo: { width: 260, height: 190, borderRadius: 8, backgroundColor: couleurs.trait },
  photoSeule: { width: 680, maxWidth: '100%', height: 240 },
  voile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 26, 22, 0.9)',
  },
  photoPleine: { width: '100%', height: '80%' },
  bandeau: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: couleurs.trait,
    fontFamily: polices.texteMoyen,
    fontSize: 14,
    color: couleurs.encre,
  },
  structure: { fontFamily: polices.texteGras, fontSize: 14, color: couleurs.sapin },
  titre: {
    fontFamily: polices.titre,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: couleurs.encre,
  },
  directeur: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  texteDirecteur: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.succes },
  // Lignes réglées, comme sur la fiche : pas de carte blanche.
  infos: {
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: couleurs.trait,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  texteInfo: { flex: 1, fontFamily: polices.texte, fontSize: 15, color: couleurs.encre },
  titreSection: {
    fontFamily: polices.titre,
    fontSize: 19,
    letterSpacing: -0.4,
    color: couleurs.encre,
  },
  texte: { fontFamily: polices.texte, fontSize: 16, lineHeight: 24, color: couleurs.encre },
  note: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2, textAlign: 'center' },
  actions: { gap: 10, marginTop: 8 },
});
