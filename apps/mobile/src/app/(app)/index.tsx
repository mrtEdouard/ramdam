import { StyleSheet, Text, View } from 'react-native';
import { Bouton } from '@/components/bouton';
import { EcranFormulaire } from '@/components/ecran-formulaire';
import { Logo } from '@/components/logo';
import { texte } from '@/constants/styles-communs';
import { useSession } from '@/session/session-context';

// Accueil provisoire : il sera remplacé par les activités et offres récentes.
export default function Accueil() {
  const { session, deconnecter } = useSession();
  if (!session) {
    return null;
  }
  const { pseudo, role, xp } = session.utilisateur;

  return (
    <EcranFormulaire>
      <Logo />
      <View style={styles.entete}>
        <Text style={texte.titre} accessibilityRole="header">
          Salut {pseudo}
        </Text>
        <Text style={texte.intro}>
          Compte {role === 'DIRECTEUR' ? 'Directeur' : 'Animateur'} · {xp} XP
        </Text>
      </View>
      <Bouton titre="Se déconnecter" onPress={deconnecter} />
    </EcranFormulaire>
  );
}

const styles = StyleSheet.create({
  entete: { gap: 6, marginTop: 8 },
});
