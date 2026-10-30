import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { couleurs } from '@/constants/theme';

type Props = {
  cochee: boolean;
  onChange: (cochee: boolean) => void;
  enErreur?: boolean;
  children: ReactNode;
};

export function CaseACocher({ cochee, onChange, enErreur = false, children }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!cochee)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: cochee }}
      hitSlop={6}
      style={styles.ligne}
    >
      <View
        style={[
          styles.case,
          cochee && styles.cochee,
          enErreur && !cochee && { borderColor: couleurs.erreur },
        ]}
      >
        {cochee && <Check size={16} color={couleurs.surface} strokeWidth={3} />}
      </View>
      <View style={styles.texte}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  case: {
    width: 24,
    height: 24,
    marginTop: 1,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: couleurs.encre3,
    backgroundColor: couleurs.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cochee: { backgroundColor: couleurs.encre, borderColor: couleurs.encre },
  texte: { flex: 1 },
});
