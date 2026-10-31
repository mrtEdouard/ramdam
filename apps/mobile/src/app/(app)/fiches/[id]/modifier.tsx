import type { CreerFicheDto, FicheDetail } from '@ramdam/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { FormulaireFiche } from '@/components/formulaire-fiche';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { appeler } from '@/lib/api';
import { useSession } from '@/session/session-context';

export default function ModifierFiche() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { donnees: fiche, erreur } = useRequete<FicheDetail>(`/fiches/${id}`);

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

  async function enregistrer(dto: CreerFicheDto) {
    await appeler('PATCH', `/fiches/${id}`, session!.jeton, dto);
    // Retour au détail, qui se recharge en revenant à l'écran.
    router.back();
  }

  return <FormulaireFiche fiche={fiche} envoyer={enregistrer} />;
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: couleurs.fond,
  },
});
