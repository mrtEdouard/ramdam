import type { OffreDetail, OffreDto } from '@ramdam/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { FormulaireOffre } from '@/components/formulaire-offre';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { appeler } from '@/lib/api';
import { useSession } from '@/session/session-context';

export default function ModifierOffre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { donnees: offre, erreur } = useRequete<OffreDetail>(`/offres/${id}`);

  async function enregistrer(dto: OffreDto) {
    await appeler('PUT', `/offres/${id}`, session!.jeton, dto);
    return id;
  }

  if (erreur || (offre && !offre.estAMoi)) {
    return (
      <View style={styles.centre}>
        <MessageErreur message={erreur ?? 'Tu ne peux modifier que tes offres.'} />
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
  return <FormulaireOffre offre={offre} enregistrer={enregistrer} termine={() => router.back()} />;
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});
