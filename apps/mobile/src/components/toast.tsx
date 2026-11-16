import { Sparkles } from 'lucide-react-native';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { couleurs, polices } from '@/constants/theme';

type Toast = { id: number; message: string };

const ContexteToast = createContext<(message: string) => void>(() => {});

// Petite notification passagère en bas de l'écran (« +1 XP pour avoir aimé cette fiche »).
// N'importe quel écran l'affiche avec : const afficherToast = useToast(); afficherToast('…');
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const afficher = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    // Disparaît seule après 2,6 secondes, sauf si un nouveau message l'a déjà remplacée.
    setTimeout(() => setToast((actuel) => (actuel?.id === id ? null : actuel)), 2600);
  }, []);

  return (
    <ContexteToast value={afficher}>
      {children}
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(250)}
          exiting={FadeOut.duration(200)}
          style={styles.toast}
          pointerEvents="none"
          // Le lecteur d'écran lit le message dès qu'il apparaît.
          accessibilityLiveRegion="polite"
          role="status"
        >
          <Sparkles size={18} color="#F5C24C" strokeWidth={2} />
          <Text style={styles.texte}>{toast.message}</Text>
        </Animated.View>
      )}
    </ContexteToast>
  );
}

export function useToast() {
  return use(ContexteToast);
}

const styles = StyleSheet.create({
  // Au-dessus de la barre de navigation, centrée.
  toast: {
    position: 'absolute',
    bottom: 104,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '90%',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: couleurs.encre,
    boxShadow: '0 8px 24px rgba(28, 26, 51, 0.25)',
  },
  texte: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.surface },
});
