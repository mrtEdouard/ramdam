import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';
import { adresseImage } from '@/lib/images';

type Props = {
  pseudo: string;
  // Photo de profil (/images/….webp) ; sans photo, on affiche les deux premières lettres du pseudo.
  url?: string | null;
  taille?: number;
};

export function Avatar({ pseudo, url, taille = 28 }: Props) {
  const rond = { width: taille, height: taille, borderRadius: taille / 2 };
  if (url) {
    return (
      <Image
        source={adresseImage(url)}
        style={[styles.rond, rond]}
        contentFit="cover"
        transition={150}
        aria-hidden
      />
    );
  }
  const initiales = pseudo
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[styles.rond, rond]} aria-hidden>
      <Text style={[styles.texte, { fontSize: taille * 0.38 }]}>{initiales}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rond: { alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.corailDoux },
  texte: { fontFamily: polices.texteGras, color: couleurs.encre },
});
