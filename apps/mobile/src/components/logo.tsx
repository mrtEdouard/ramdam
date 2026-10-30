import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { couleurs, polices } from '@/constants/theme';

// Trois barres de niveau sonore : celle du milieu monte plus haut, comme le bruit d'un « ramdam ».
export function Logo() {
  return (
    <View style={styles.ligne} accessible accessibilityRole="image" accessibilityLabel="Ramdam">
      <Svg width={32} height={32} viewBox="0 0 64 64">
        <Rect x={9} y={27} width={12} height={28} rx={6} fill={couleurs.encre} />
        <Rect x={26} y={9} width={12} height={46} rx={6} fill={couleurs.corail} />
        <Rect x={43} y={33} width={12} height={22} rx={6} fill={couleurs.encre} />
      </Svg>
      <Text style={styles.mot}>ramdam</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mot: { fontFamily: polices.titre, fontSize: 28, letterSpacing: -1, color: couleurs.encre },
});
