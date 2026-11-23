import type { FicheResume, PageDeFiches, PageDOffres, Profil } from '@ramdam/shared';
import { Link } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { CarteFiche } from '@/components/carte-fiche';
import { CarteUne } from '@/components/carte-une';
import { InvitationInstallation } from '@/components/fenetre-installation';
import { LigneOffre } from '@/components/ligne-offre';
import { Logo } from '@/components/logo';
import { MessageErreur } from '@/components/message-erreur';
import { RechercheAccueil } from '@/components/recherche-accueil';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { useSession } from '@/session/session-context';

export default function Accueil() {
  const { session } = useSession();
  const aLaUne = useRequete<FicheResume | null>('/fiches/a-la-une');
  const recentes = useRequete<PageDeFiches>('/fiches?parPage=9');
  const offres = useRequete<PageDOffres>('/offres?parPage=3');
  // Rechargé à chaque retour sur l'accueil : la cloche se remet à zéro après la lecture.
  const nonLues = useRequete<{ nombre: number }>('/notifications/non-lues').donnees?.nombre ?? 0;
  // Ma photo de profil, en haut à droite (rechargée au retour, après un changement de photo).
  const monAvatar = useRequete<Profil>('/profils/moi').donnees?.avatarUrl;
  const [rechercheActive, setRechercheActive] = useState(false);
  if (!session) {
    return null;
  }
  const { pseudo } = session.utilisateur;
  // La fiche à la une n'est pas répétée dans le carrousel.
  const autresFiches = (recentes.donnees?.fiches ?? []).filter(
    (fiche) => fiche.id !== aLaUne.donnees?.id,
  );
  const erreur = aLaUne.erreur ?? recentes.erreur ?? offres.erreur;

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      {/* Sur le site : propose d'ajouter Ramdam à l'écran d'accueil du téléphone. */}
      <InvitationInstallation />
      <ScrollView contentContainerStyle={styles.defilement} showsVerticalScrollIndicator={false}>
        <View style={styles.entete}>
          <Logo />
          <View style={styles.actionsEntete}>
            <Link href="/notifications" asChild>
              <Pressable
                style={styles.cloche}
                accessibilityRole="button"
                accessibilityLabel={
                  nonLues ? `Notifications, ${nonLues} nouvelles` : 'Notifications'
                }
                hitSlop={8}
              >
                <Bell size={22} color={couleurs.encre} strokeWidth={2} />
                {nonLues > 0 && <Text style={styles.badge}>{nonLues > 9 ? '9+' : nonLues}</Text>}
              </Pressable>
            </Link>
            <Link href="/profil" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Mon profil" hitSlop={8}>
                <Avatar pseudo={pseudo} url={monAvatar} taille={40} />
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.salutation}>
          <Text style={styles.bonjour} accessibilityRole="header">
            Salut {pseudo}
          </Text>
          <Text style={styles.question}>Qu'est-ce qu'on anime cette semaine ?</Text>
        </View>

        {/* Recherche et catégories : les résultats s'affichent ici même. */}
        <RechercheAccueil changerActif={setRechercheActive} />

        {/* Pendant une recherche, les sections de l'accueil laissent la place aux résultats. */}
        {!rechercheActive && (
          <>
            {erreur && (
              <View style={styles.espace}>
                <MessageErreur message={erreur} />
              </View>
            )}

            {aLaUne.donnees && (
              <>
                <EnTeteSection
                  titre="À la une"
                  sousTitre="L'activité la plus aimée de la semaine"
                />
                <CarteUne fiche={aLaUne.donnees} />
              </>
            )}

            <EnTeteSection titre="Activités récentes publiées" lien="/activites" />
            {recentes.chargement && !recentes.donnees ? (
              <ActivityIndicator color={couleurs.corail} style={styles.chargement} />
            ) : autresFiches.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horsMarge}
                contentContainerStyle={styles.carrousel}
              >
                {autresFiches.map((fiche) => (
                  <CarteFiche key={fiche.id} fiche={fiche} />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.vide}>Aucune autre activité publiée pour l'instant.</Text>
            )}

            <EnTeteSection titre="Prochaines offres" lien="/offres" />
            {offres.donnees?.offres.length === 0 ? (
              <Text style={styles.vide}>Aucune offre ouverte pour l'instant.</Text>
            ) : (
              <View style={styles.panneauOffres}>
                {offres.donnees?.offres.map((offre, position) => (
                  <Fragment key={offre.id}>
                    {position > 0 && <View style={styles.separateur} />}
                    <LigneOffre offre={offre} />
                  </Fragment>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type PropsEnTete = { titre: string; sousTitre?: string; lien?: '/activites' | '/offres' };

function EnTeteSection({ titre, sousTitre, lien }: PropsEnTete) {
  return (
    <View style={styles.enTeteSection}>
      <View style={styles.titres}>
        <Text style={styles.titreSection} accessibilityRole="header">
          {titre}
        </Text>
        {sousTitre && <Text style={styles.sousTitre}>{sousTitre}</Text>}
      </View>
      {lien && (
        <Link href={lien} style={styles.toutVoir} accessibilityLabel={`Tout voir : ${titre}`}>
          Tout voir
        </Link>
      )}
    </View>
  );
}

const MARGE = 20;

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  defilement: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: MARGE,
    paddingBottom: 32,
  },
  actionsEntete: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cloche: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.surface,
    borderWidth: 1,
    borderColor: couleurs.trait,
  },
  // Pastille du nombre de notifications non lues, posée en haut à droite de la cloche.
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: couleurs.corail,
    fontFamily: polices.texteGras,
    fontSize: 11,
    color: couleurs.surface,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  salutation: { marginTop: 12, gap: 4 },
  bonjour: {
    fontFamily: polices.titre,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
    color: couleurs.encre,
  },
  question: { fontFamily: polices.texte, fontSize: 16, color: couleurs.encre2 },
  // Les listes horizontales débordent jusqu'aux bords de l'écran,
  // mais leur premier élément reste aligné sur la marge.
  horsMarge: { marginHorizontal: -MARGE },
  enTeteSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 30,
    marginBottom: 14,
  },
  titres: { flexShrink: 1, gap: 2 },
  sousTitre: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
  titreSection: {
    fontFamily: polices.titre,
    fontSize: 21,
    letterSpacing: -0.6,
    color: couleurs.encre,
  },
  toutVoir: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.corail },
  carrousel: { gap: 14, paddingHorizontal: MARGE },
  chargement: { paddingVertical: 40 },
  espace: { marginTop: 20 },
  vide: { fontFamily: polices.texte, fontSize: 15, color: couleurs.encre2 },
  panneauOffres: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  separateur: { height: 1, marginLeft: 68, backgroundColor: couleurs.trait },
});
