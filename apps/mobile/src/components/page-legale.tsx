import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';
import type { PageLegale as Page } from '@/constants/textes-legaux';

// Affiche une page légale. Ces pages sont publiques : on les lit sans être connecté,
// par exemple avant de cocher « J'accepte les conditions » à l'inscription.
export function PageLegale({ page }: { page: Page }) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.titre} accessibilityRole="header">
        {page.titre}
      </Text>
      <Text style={styles.date}>Mise à jour le {page.miseAJour}</Text>
      <Text style={styles.intro}>{page.intro}</Text>

      {page.sections.map((section) => (
        <View key={section.titre} style={styles.section}>
          <Text style={styles.titreSection} accessibilityRole="header">
            {section.titre}
          </Text>
          {section.paragraphes.map((paragraphe) =>
            paragraphe.startsWith('– ') ? (
              <View key={paragraphe} style={styles.element}>
                <Text style={styles.puce}>–</Text>
                <Text style={[styles.texte, styles.texteElement]}>{paragraphe.slice(2)}</Text>
              </View>
            ) : (
              <Text key={paragraphe} style={styles.texte}>
                {paragraphe}
              </Text>
            ),
          )}
        </View>
      ))}

      <LiensLegaux />
    </ScrollView>
  );
}

// Les trois pages, liées entre elles ; aussi en pied du profil.
export function LiensLegaux() {
  return (
    <View style={styles.liens}>
      <Link href="/legal/mentions-legales" style={styles.lien}>
        Mentions légales
      </Link>
      <Link href="/legal/cgu" style={styles.lien}>
        Conditions d’utilisation
      </Link>
      <Link href="/legal/confidentialite" style={styles.lien}>
        Confidentialité
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 10,
    padding: 20,
    paddingBottom: 48,
  },
  titre: {
    fontFamily: polices.titre,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: couleurs.encre,
  },
  date: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre3 },
  intro: {
    marginTop: 6,
    fontFamily: polices.texteMoyen,
    fontSize: 16,
    lineHeight: 24,
    color: couleurs.encre,
  },
  section: {
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: couleurs.trait,
  },
  titreSection: {
    fontFamily: polices.titre,
    fontSize: 18,
    letterSpacing: -0.3,
    color: couleurs.encre,
  },
  texte: { fontFamily: polices.texte, fontSize: 15, lineHeight: 23, color: couleurs.encre2 },
  element: { flexDirection: 'row', gap: 8 },
  puce: { fontFamily: polices.texteGras, fontSize: 15, lineHeight: 23, color: couleurs.corail },
  texteElement: { flex: 1 },
  liens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 16,
    rowGap: 6,
    marginTop: 24,
  },
  lien: {
    fontFamily: polices.texteMoyen,
    fontSize: 13,
    color: couleurs.encre2,
    textDecorationLine: 'underline',
  },
});
