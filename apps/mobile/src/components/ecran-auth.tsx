import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/logo';
import { couleurs, polices } from '@/constants/theme';

type Props = {
  titre: string;
  intro: string;
  // Lien affiché sous le formulaire (« Déjà inscrit ? Se connecter »).
  pied: ReactNode;
  children: ReactNode;
};

// Mise en page des écrans de connexion et d'inscription :
// logo, titre et formulaire dans une carte, centrés dans l'écran.
export function EcranAuth({ titre, intro, pied, children }: Props) {
  return (
    <SafeAreaView style={styles.ecran}>
      <KeyboardAvoidingView
        style={styles.colonne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.defilement}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contenu}>
            <View style={styles.entete}>
              <Logo />
              <Text style={styles.titre} accessibilityRole="header">
                {titre}
              </Text>
              <Text style={styles.intro}>{intro}</Text>
            </View>
            <View style={styles.carte}>{children}</View>
            <View style={styles.pied}>{pied}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  colonne: { flex: 1 },
  // flexGrow + justifyContent : le formulaire est centré verticalement,
  // et l'écran défile seulement s'il est plus haut que la fenêtre.
  defilement: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 32 },
  contenu: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 24 },
  entete: { alignItems: 'center', gap: 10 },
  titre: {
    marginTop: 14,
    fontFamily: polices.titre,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
    color: couleurs.encre,
    textAlign: 'center',
  },
  intro: {
    maxWidth: 290,
    fontFamily: polices.texte,
    fontSize: 15,
    lineHeight: 22,
    color: couleurs.encre2,
    textAlign: 'center',
  },
  carte: {
    gap: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
    // Ombre très légère : la carte se détache du fond sans effet de relief marqué.
    boxShadow: '0 1px 2px rgba(28, 26, 51, 0.04), 0 8px 24px rgba(28, 26, 51, 0.06)',
  },
  pied: { alignItems: 'center' },
});
