import { Image } from 'expo-image';
import { EllipsisVertical, Share, SquarePlus, Smartphone, X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bouton } from '@/components/bouton';
import { useToast } from '@/components/toast';
import { couleurs, polices } from '@/constants/theme';
import { reporteeRecemment, reporter, useInstallation } from '@/lib/installation';

// Petite fenêtre « Ajoute Ramdam à ton téléphone ».
export function FenetreInstallation({ ouverte, fermer }: { ouverte: boolean; fermer: () => void }) {
  const installation = useInstallation();
  const afficherToast = useToast();

  async function installer() {
    const acceptee = await installation.installer();
    if (acceptee) {
      afficherToast('Ramdam est sur ton écran d’accueil');
    } else {
      reporter();
    }
    fermer();
  }

  function plusTard() {
    reporter();
    fermer();
  }

  return (
    <Modal visible={ouverte} transparent animationType="fade" onRequestClose={plusTard}>
      <Pressable style={styles.voile} onPress={plusTard} accessibilityLabel="Fermer">
        <Animated.View entering={FadeInDown.duration(300)} style={styles.largeur}>
          <Pressable style={styles.fenetre} onPress={() => {}}>
            <Pressable
              onPress={plusTard}
              style={styles.fermer}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={20} color={couleurs.encre2} />
            </Pressable>

            <Image
              source={{ uri: '/icones/icone-192.png' }}
              style={styles.icone}
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.titre} accessibilityRole="header">
              Ramdam sur ton {installation.telephone ? 'téléphone' : 'ordinateur'}
            </Text>
            <Text style={styles.texte}>
              Ouvre Ramdam d’un appui depuis ton écran d’accueil, en plein écran, comme une vraie
              app.
            </Text>

            {installation.enUnAppui ? (
              // Chrome, Samsung Internet… : le navigateur installe pour nous.
              <Bouton
                titre={
                  installation.telephone
                    ? 'Ajouter à mon téléphone'
                    : 'Installer sur mon ordinateur'
                }
                onPress={installer}
              />
            ) : installation.iphone ? (
              // Safari ne permet pas d'installer depuis un bouton : on explique la manipulation.
              <View style={styles.etapes}>
                <Etape numero={1} icone={<Share size={18} color={couleurs.encre} />}>
                  Touche <Text style={styles.gras}>Partager</Text> en bas de Safari
                </Etape>
                <Etape numero={2} icone={<SquarePlus size={18} color={couleurs.encre} />}>
                  Choisis <Text style={styles.gras}>Sur l’écran d’accueil</Text>
                </Etape>
              </View>
            ) : (
              <View style={styles.etapes}>
                <Etape numero={1} icone={<EllipsisVertical size={18} color={couleurs.encre} />}>
                  Ouvre le <Text style={styles.gras}>menu</Text> du navigateur
                </Etape>
                <Etape numero={2} icone={<Smartphone size={18} color={couleurs.encre} />}>
                  Choisis <Text style={styles.gras}>Installer l’application</Text> ou{' '}
                  <Text style={styles.gras}>Ajouter à l’écran d’accueil</Text>
                </Etape>
              </View>
            )}

            <Pressable onPress={plusTard} hitSlop={8} accessibilityRole="button">
              <Text style={styles.plusTard}>Plus tard</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Ouvre la fenêtre toute seule sur l'accueil, une fois par visite, si l'app n'est pas installée
// et que l'utilisateur n'a pas répondu « Plus tard » cette semaine.
export function InvitationInstallation() {
  const { proposable, enUnAppui, telephone } = useInstallation();
  const [ouverte, setOuverte] = useState(false);
  const dejaProposee = useRef(false);

  useEffect(() => {
    // Sur ordinateur, on ne propose que si le navigateur installe en un appui.
    if (dejaProposee.current || !proposable || !(telephone || enUnAppui) || reporteeRecemment()) {
      return;
    }
    // Un court délai : on laisse d'abord l'accueil s'afficher.
    const minuterie = setTimeout(() => {
      dejaProposee.current = true;
      setOuverte(true);
    }, 1200);
    return () => clearTimeout(minuterie);
  }, [proposable, enUnAppui, telephone]);

  return <FenetreInstallation ouverte={ouverte} fermer={() => setOuverte(false)} />;
}

function Etape({
  numero,
  icone,
  children,
}: {
  numero: number;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.etape}>
      <Text style={styles.numero}>{numero}</Text>
      {icone}
      <Text style={styles.texteEtape}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(30, 26, 22, 0.45)',
  },
  largeur: { width: '100%', maxWidth: 360 },
  fenetre: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: couleurs.fond,
  },
  fermer: { position: 'absolute', top: 12, right: 12 },
  icone: { width: 64, height: 64, borderRadius: 14 },
  titre: {
    fontFamily: polices.titre,
    fontSize: 21,
    letterSpacing: -0.4,
    textAlign: 'center',
    color: couleurs.encre,
  },
  texte: {
    fontFamily: polices.texte,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: couleurs.encre2,
  },
  etapes: {
    alignSelf: 'stretch',
    gap: 10,
    padding: 14,
    borderRadius: 8,
    backgroundColor: couleurs.surface,
  },
  etape: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numero: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 22,
    backgroundColor: couleurs.corail,
    fontFamily: polices.texteGras,
    fontSize: 12,
    color: couleurs.surface,
  },
  texteEtape: { flex: 1, fontFamily: polices.texte, fontSize: 14, color: couleurs.encre },
  gras: { fontFamily: polices.texteGras },
  plusTard: {
    paddingVertical: 4,
    fontFamily: polices.texteMoyen,
    fontSize: 14,
    color: couleurs.encre2,
    textDecorationLine: 'underline',
  },
});
