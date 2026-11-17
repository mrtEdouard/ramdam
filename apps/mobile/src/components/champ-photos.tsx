import { Image, type ImageSource } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';
import { adresseImage } from '@/lib/images';
import { preparerPhoto } from '@/lib/photos';

export type PhotoEnLigne = { id: string; url: string };

type Props = {
  libelle: string;
  maximum: number;
  // Photos déjà enregistrées (on peut en retirer) et nouvelles photos choisies, pas encore envoyées.
  photosGardees: PhotoEnLigne[];
  nouvellesPhotos: string[];
  changerGardees: (photos: PhotoEnLigne[]) => void;
  changerNouvelles: (photos: string[]) => void;
  // Une photo illisible (HEIC dans Chrome) : le formulaire affiche le message.
  signalerErreur: (message: string) => void;
  aide?: string;
};

// Galerie d'un formulaire (fiche ou offre) : vignettes, retrait, et ajout depuis la photothèque.
// Rien n'est envoyé ici : le formulaire envoie les photos après avoir enregistré les champs.
export function ChampPhotos({
  libelle,
  maximum,
  photosGardees,
  nouvellesPhotos,
  changerGardees,
  changerNouvelles,
  signalerErreur,
  aide,
}: Props) {
  const places = maximum - photosGardees.length - nouvellesPhotos.length;

  async function ajouter() {
    const choix = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: places,
      quality: 0.85,
    });
    if (!choix.canceled) {
      try {
        const preparees = await Promise.all(choix.assets.slice(0, places).map(preparerPhoto));
        changerNouvelles([...nouvellesPhotos, ...preparees]);
      } catch (e) {
        signalerErreur((e as Error).message);
      }
    }
  }

  return (
    <View style={styles.groupe}>
      <Text style={styles.libelle}>
        {libelle}{' '}
        <Text style={styles.compte}>
          ({maximum - places}/{maximum})
        </Text>
      </Text>
      {aide && <Text style={styles.aide}>{aide}</Text>}
      <View style={styles.galerie}>
        {photosGardees.map((photo) => (
          <Vignette
            key={photo.id}
            source={adresseImage(photo.url)}
            retirer={() => changerGardees(photosGardees.filter((p) => p.id !== photo.id))}
          />
        ))}
        {nouvellesPhotos.map((photo) => (
          <Vignette
            key={photo}
            source={{ uri: photo }}
            retirer={() => changerNouvelles(nouvellesPhotos.filter((p) => p !== photo))}
          />
        ))}
        {places > 0 && (
          <Pressable
            onPress={ajouter}
            style={[styles.vignette, styles.ajout]}
            accessibilityRole="button"
            accessibilityLabel="Ajouter des photos"
          >
            <ImagePlus size={24} color={couleurs.corail} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Vignette({ source, retirer }: { source: ImageSource; retirer: () => void }) {
  return (
    <View>
      <Image source={source} style={styles.vignette} contentFit="cover" />
      <Pressable
        onPress={retirer}
        style={styles.retirer}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Retirer cette photo"
      >
        <X size={14} color={couleurs.surface} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  groupe: { gap: 8 },
  libelle: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  compte: { fontFamily: polices.texte, color: couleurs.encre2 },
  aide: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
  galerie: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vignette: { width: 92, height: 92, borderRadius: 8, backgroundColor: couleurs.trait },
  ajout: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  retirer: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 26, 51, 0.75)',
  },
});
