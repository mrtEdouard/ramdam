import type { Region } from '@ramdam/shared';
import { MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Puce } from '@/components/puce';
import { TraceRegion } from '@/components/trace-region';
import { HAUTEUR_CARTE, LARGEUR_CARTE, regionsCarte } from '@/constants/carte-regions';
import { couleurs, polices } from '@/constants/theme';

type Props = {
  choisie: Region | undefined;
  choisir: (region: Region) => void;
};

// Carte de France découpée en régions : on touche une région pour la choisir.
// Les contours sont dessinés en SVG (constants/carte-regions.ts, généré à partir des données IGN).
// L'outre-mer n'est pas sur la carte : une pastille à part le propose.
export function CarteRegions({ choisie, choisir }: Props) {
  const regionChoisie = regionsCarte.find((r) => r.nom === choisie);

  return (
    <View style={styles.bloc}>
      <Svg
        viewBox={`-4 -4 ${LARGEUR_CARTE + 8} ${HAUTEUR_CARTE + 8}`}
        style={styles.carte}
        accessibilityLabel="Carte des régions de France"
      >
        {regionsCarte.map((region) => (
          <TraceRegion
            key={region.nom}
            nom={region.nom}
            trace={region.trace}
            choisie={region.nom === choisie}
            choisir={() => choisir(region.nom)}
          />
        ))}
        {/* Un repère sur la région choisie, comme une punaise sur une carte. */}
        {regionChoisie && (
          <G pointerEvents="none">
            <Circle
              cx={regionChoisie.centre[0]}
              cy={regionChoisie.centre[1]}
              r={7}
              fill={couleurs.surface}
              stroke={couleurs.encre}
              strokeWidth={2}
            />
            <Circle
              cx={regionChoisie.centre[0]}
              cy={regionChoisie.centre[1]}
              r={2.5}
              fill={couleurs.encre}
            />
          </G>
        )}
      </Svg>

      <View style={styles.pied}>
        <View style={styles.choix}>
          <MapPin size={16} color={choisie ? couleurs.encre : couleurs.encre3} />
          <Text
            style={[styles.texteChoix, !choisie && styles.texteVide]}
            accessibilityLiveRegion="polite"
          >
            {choisie ?? 'Touche une région sur la carte'}
          </Text>
        </View>
        <Puce
          libelle="Outre-mer"
          choisie={choisie === 'Outre-mer'}
          onPress={() => choisir('Outre-mer')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: 10 },
  carte: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    aspectRatio: (LARGEUR_CARTE + 8) / (HAUTEUR_CARTE + 8),
  },
  pied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  choix: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  texteChoix: { flex: 1, fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  texteVide: { fontFamily: polices.texte, color: couleurs.encre3 },
});
