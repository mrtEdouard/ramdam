import { Image, type ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/logo';
import { couleurs, polices } from '@/constants/theme';
import { useEcranLarge } from '@/hooks/use-ecran-large';

type Props = {
  titre: string;
  intro: string;
  photo: { source: ImageSource; credit: string };
  // Lien affiché sous le formulaire (« Déjà inscrit ? Se connecter »).
  pied: ReactNode;
  children: ReactNode;
};

// Mise en page des écrans de connexion et d'inscription.
// Téléphone : logo, titre et formulaire dans une carte, centrés dans l'écran.
// Grand écran : la photo occupe toute la moitié gauche, le formulaire la moitié droite.
export function EcranAuth({ titre, intro, photo, pied, children }: Props) {
  const ecranLarge = useEcranLarge();

  const formulaire = (
    <KeyboardAvoidingView
      style={styles.colonne}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.defilement, ecranLarge && styles.defilementLarge]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contenu, ecranLarge && styles.contenuLarge]}>
          <View style={[styles.entete, ecranLarge && styles.enteteLarge]}>
            <Logo />
            <Text
              style={[styles.titre, ecranLarge && styles.texteAGauche]}
              accessibilityRole="header"
            >
              {titre}
            </Text>
            <Text style={[styles.intro, ecranLarge && styles.texteAGauche]}>{intro}</Text>
          </View>

          <View style={ecranLarge ? styles.formulaireLarge : styles.carte}>{children}</View>

          <View style={ecranLarge ? styles.piedLarge : styles.pied}>{pied}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (!ecranLarge) {
    return <SafeAreaView style={styles.ecran}>{formulaire}</SafeAreaView>;
  }

  return (
    <View style={styles.ecranLarge}>
      <View style={styles.panneauPhoto}>
        <Image source={photo.source} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.legende}>
          <Text style={styles.accroche}>
            Les jeux, les veillées et les grands jeux des animateurs, au même endroit.
          </Text>
          <Text style={styles.credit}>Photo : {photo.credit}</Text>
        </View>
      </View>
      <View style={styles.panneauFormulaire}>{formulaire}</View>
    </View>
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

  // Grand écran : deux moitiés collées aux bords, sans marge.
  ecranLarge: { flex: 1, flexDirection: 'row', backgroundColor: couleurs.surface },
  panneauPhoto: { flex: 1, justifyContent: 'flex-end' },
  // Encart sombre posé sur la photo : le texte reste lisible quelle que soit l'image.
  legende: {
    margin: 32,
    maxWidth: 440,
    padding: 24,
    gap: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 26, 51, 0.9)',
  },
  accroche: {
    fontFamily: polices.titre,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.8,
    color: couleurs.surface,
  },
  credit: { fontFamily: polices.texte, fontSize: 12, color: couleurs.surface, opacity: 0.8 },
  panneauFormulaire: { flex: 1, backgroundColor: couleurs.surface },
  defilementLarge: { paddingHorizontal: 64, paddingVertical: 24 },
  contenuLarge: { maxWidth: 460, gap: 18 },
  enteteLarge: { alignItems: 'flex-start', gap: 8 },
  texteAGauche: { marginTop: 0, textAlign: 'left', maxWidth: undefined },
  formulaireLarge: { gap: 14 },
  piedLarge: { alignItems: 'flex-start' },
});
