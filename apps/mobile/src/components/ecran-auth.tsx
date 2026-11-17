import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/logo';
import { MessageErreur } from '@/components/message-erreur';
import { couleurs, polices } from '@/constants/theme';
import { useSession } from '@/session/session-context';

type Props = {
  titre: string;
  intro: string;
  // Lien affiché sous le formulaire (« Déjà inscrit ? Se connecter »).
  pied: ReactNode;
  children: ReactNode;
};

// Mise en page des écrans de connexion et d'inscription : logo, grand titre aligné à gauche
// et formulaire posé directement sur le fond, sans carte centrée (le schéma le plus générique).

export function EcranAuth({ titre, intro, pied, children }: Props) {
  const { avertissement } = useSession();
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
              {/* Déconnecté de force (compte supprimé, session expirée) : on dit pourquoi. */}
              {avertissement && <MessageErreur message={avertissement} />}
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
  // L'écran défile seulement s'il est plus haut que la fenêtre.
  defilement: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
  contenu: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 28 },
  entete: { alignItems: 'flex-start', gap: 10 },
  titre: {
    marginTop: 36,
    fontFamily: polices.titre,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.4,
    color: couleurs.encre,
  },
  intro: { fontFamily: polices.texte, fontSize: 16, lineHeight: 23, color: couleurs.encre2 },
  carte: { gap: 20 },
  pied: { alignItems: 'flex-start' },
});
