import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { couleurs } from '@/constants/theme';

// Mise en page commune aux écrans de formulaire : zones sûres de l'écran,
// défilement, et contenu qui remonte quand le clavier s'ouvre.
export function EcranFormulaire({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.ecran}>
      <KeyboardAvoidingView
        style={styles.ecran}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  contenu: {
    flexGrow: 1,
    width: '100%',
    // Sur tablette ou navigateur, le formulaire garde une largeur de téléphone.
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
});
