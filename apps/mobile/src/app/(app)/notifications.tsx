import type { Notification } from '@ramdam/shared';
import { Link, router } from 'expo-router';
import { Backpack, Bell, Heart } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { appeler } from '@/lib/api';
import { depuis } from '@/lib/format';
import { useSession } from '@/session/session-context';

// Qui a aimé mes fiches, qui les a gardées dans sa Malle (RG-24).
export default function Notifications() {
  const { session } = useSession();
  const {
    donnees: notifications,
    erreur,
    chargement,
  } = useRequete<Notification[]>('/notifications');

  // Une fois la liste affichée, tout est marqué comme lu : la cloche de l'accueil se remet à zéro.
  // Les nouvelles restent signalées par un point jusqu'au prochain passage.
  const nonLues = notifications?.some((n) => !n.lue);
  useEffect(() => {
    if (nonLues && session) {
      appeler('POST', '/notifications/lues', session.jeton).catch(() => {});
    }
  }, [nonLues, session]);

  if (erreur) {
    return (
      <View style={styles.centre}>
        <MessageErreur message={erreur} />
      </View>
    );
  }
  if (chargement && !notifications) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator
          color={couleurs.corail}
          accessibilityLabel="Chargement des notifications"
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {notifications?.length === 0 && (
        <View style={styles.vide}>
          <Bell size={28} color={couleurs.encre2} />
          <Text style={styles.texteVide}>
            Rien pour l’instant. Quand quelqu’un aimera ou gardera une de tes fiches, tu le verras
            ici.
          </Text>
        </View>
      )}
      {notifications?.map((notification) => (
        <LigneNotification key={notification.id} notification={notification} />
      ))}
    </ScrollView>
  );
}

function LigneNotification({ notification }: { notification: Notification }) {
  const aime = notification.type === 'FICHE_AIMEE';
  const Icone = aime ? Heart : Backpack;
  const action = aime ? 'a aimé ta fiche' : 'a gardé ta fiche';
  const profil = {
    pathname: '/profils/[pseudo]',
    params: { pseudo: notification.acteur },
  } as const;

  // Deux zones séparées (pas l'une dans l'autre, sinon c'est toujours la plus grande qui
  // reçoit l'appui) : l'avatar et le pseudo ouvrent le profil, la phrase ouvre la fiche.
  return (
    <View style={[styles.ligne, !notification.lue && styles.nonLue]}>
      <Link href={profil} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`Profil de ${notification.acteur}`}>
          <Avatar pseudo={notification.acteur} taille={44} />
          <View
            style={[styles.pastille, { backgroundColor: aime ? couleurs.corail : couleurs.encre }]}
          >
            <Icone
              size={11}
              color={couleurs.surface}
              fill={aime ? couleurs.surface : 'none'}
              strokeWidth={2.5}
            />
          </View>
        </Pressable>
      </Link>
      <View style={styles.textes}>
        <Link href={profil} style={styles.pseudo}>
          {notification.acteur}
        </Link>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/fiches/[id]', params: { id: notification.fiche.id } })
          }
          accessibilityRole="button"
          accessibilityLabel={`${action} ${notification.fiche.titre}${aime ? '' : ' dans sa Malle'}${notification.lue ? '' : ', nouvelle'}`}
        >
          <Text style={styles.phrase}>
            {action} <Text style={styles.titreFiche}>« {notification.fiche.titre} »</Text>
            {aime ? '' : ' dans sa Malle'}
          </Text>
          <Text style={styles.date}>{depuis(new Date(notification.creeLe))}</Text>
        </Pressable>
      </View>
      {!notification.lue && <View style={styles.point} accessibilityElementsHidden />}
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
    maxWidth: 560,
    alignSelf: 'center',
    gap: 8,
    padding: 16,
    paddingBottom: 40,
  },
  vide: { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 24 },
  texteVide: {
    fontFamily: polices.texte,
    fontSize: 15,
    lineHeight: 22,
    color: couleurs.encre2,
    textAlign: 'center',
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: couleurs.surface,
    borderWidth: 1,
    borderColor: couleurs.trait,
  },
  nonLue: { borderColor: couleurs.corail, backgroundColor: couleurs.corailDoux },
  pastille: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: couleurs.surface,
  },
  textes: { flex: 1, gap: 2 },
  phrase: { fontFamily: polices.texte, fontSize: 15, lineHeight: 21, color: couleurs.encre },
  pseudo: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  titreFiche: { fontFamily: polices.texteMoyen },
  date: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
  point: { width: 10, height: 10, borderRadius: 5, backgroundColor: couleurs.corail },
});
