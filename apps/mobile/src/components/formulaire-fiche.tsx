import {
  creerFicheSchema,
  libellesTypeFiche,
  PHOTOS_PAR_FICHE,
  suggestionsMateriel,
  suggestionsObjectifs,
  typesFiche,
  type CreerFicheDto,
  type FicheDetail,
  type PhotoFiche,
  type TypeFiche,
} from '@ramdam/shared';
import { Image, type ImageSource } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bouton } from '@/components/bouton';
import { ChampBulles } from '@/components/champ-bulles';
import { ChampTexte } from '@/components/champ-texte';
import { MessageErreur } from '@/components/message-erreur';
import { Puce } from '@/components/puce';
import { couleurs, polices } from '@/constants/theme';
import { appeler, envoyerPhoto, ErreurApi } from '@/lib/api';
import { adresseImage } from '@/lib/images';
import { preparerPhoto } from '@/lib/photos';
import { erreursDuFormulaire } from '@/lib/validation';
import { useSession } from '@/session/session-context';

// Les nombres sont saisis comme du texte (ce que contient un TextInput) ;
// ils sont convertis au moment de valider.
type Saisie = {
  titre: string;
  type: TypeFiche | undefined;
  typePersonnalise: string;
  ageMin: string;
  ageMax: string;
  dureeMinutes: string;
  nbParticipantsMin: string;
  nbParticipantsMax: string;
  objectifs: string[];
  materiel: string[];
  deroulement: string;
};
type Champ = keyof Saisie;

// Couverture : celle déjà enregistrée, une nouvelle photo choisie (convertie en JPEG), ou aucune.
type Couverture = { url: string } | { locale: string } | null;

// Champ vide → null : Zod dira « obligatoire » pour un âge, ou retirera une limite facultative.
const enNombre = (texte: string) => (texte.trim() === '' ? null : Number(texte.replace(',', '.')));
const enTexte = (nombre: number | null | undefined) => (nombre == null ? '' : String(nombre));

function versDto(saisie: Saisie, publier: boolean) {
  return {
    ...saisie,
    typePersonnalise: saisie.type === 'AUTRE' ? saisie.typePersonnalise : null,
    ageMin: enNombre(saisie.ageMin),
    ageMax: enNombre(saisie.ageMax),
    dureeMinutes: enNombre(saisie.dureeMinutes),
    nbParticipantsMin: enNombre(saisie.nbParticipantsMin),
    nbParticipantsMax: enNombre(saisie.nbParticipantsMax),
    publier,
  };
}

type Props = {
  // Fiche existante en cas de modification, absente pour une création.
  fiche?: FicheDetail;
  // Enregistre les champs (POST ou PATCH) et renvoie l'identifiant de la fiche.
  enregistrer: (dto: CreerFicheDto) => Promise<string>;
  // Appelé quand tout est enregistré, photos comprises.
  termine: (id: string) => void;
};

// Formulaire commun à la création et à la modification d'une fiche.
export function FormulaireFiche({ fiche, enregistrer, termine }: Props) {
  const { session } = useSession();
  const [saisie, setSaisie] = useState<Saisie>({
    titre: fiche?.titre ?? '',
    type: fiche?.type,
    typePersonnalise: fiche?.typePersonnalise ?? '',
    ageMin: enTexte(fiche?.ageMin),
    ageMax: enTexte(fiche?.ageMax),
    dureeMinutes: enTexte(fiche?.dureeMinutes),
    nbParticipantsMin: enTexte(fiche?.nbParticipantsMin),
    nbParticipantsMax: enTexte(fiche?.nbParticipantsMax),
    objectifs: fiche?.objectifs ?? [],
    materiel: fiche?.materiel ?? [],
    deroulement: fiche?.deroulement ?? '',
  });
  const [couverture, setCouverture] = useState<Couverture>(
    fiche?.imageUrl ? { url: fiche.imageUrl } : null,
  );
  // Galerie : photos déjà en ligne (on peut en retirer) et nouvelles photos à envoyer.
  const [photosGardees, setPhotosGardees] = useState<PhotoFiche[]>(fiche?.photos ?? []);
  const [nouvellesPhotos, setNouvellesPhotos] = useState<string[]>([]);

  const [champsQuittes, setChampsQuittes] = useState<Partial<Record<Champ, boolean>>>({});
  const [soumis, setSoumis] = useState(false);
  const [erreursServeur, setErreursServeur] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState<'publier' | 'brouillon' | null>(null);

  // Une fiche déjà publiée ne redevient pas brouillon : un seul bouton « Enregistrer ».
  const dejaPubliee = fiche !== undefined && fiche.statut !== 'BROUILLON';
  const erreurs = erreursDuFormulaire(creerFicheSchema, versDto(saisie, true));
  const placesGalerie = PHOTOS_PAR_FICHE - photosGardees.length - nouvellesPhotos.length;

  function erreurDe(champ: Champ) {
    if (erreursServeur[champ]) {
      return erreursServeur[champ];
    }
    return soumis || champsQuittes[champ] ? erreurs[champ] : undefined;
  }

  function modifier<C extends Champ>(champ: C, valeur: Saisie[C]) {
    setSaisie({ ...saisie, [champ]: valeur });
    setErreursServeur({ ...erreursServeur, [champ]: '' });
    // Le message général date du dernier envoi : il disparaît dès qu'on corrige.
    setErreurGenerale(null);
  }

  // Propriétés communes aux champs texte : valeur, saisie, sortie du champ et erreur.
  const lier = (
    champ:
      | 'titre'
      | 'typePersonnalise'
      | 'ageMin'
      | 'ageMax'
      | 'dureeMinutes'
      | 'nbParticipantsMin'
      | 'nbParticipantsMax'
      | 'deroulement',
  ) => ({
    value: saisie[champ],
    onChangeText: (texte: string) => modifier(champ, texte),
    onBlur: () => setChampsQuittes({ ...champsQuittes, [champ]: true }),
    erreur: erreurDe(champ),
  });

  async function choisirCouverture() {
    const choix = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!choix.canceled) {
      try {
        setCouverture({ locale: await preparerPhoto(choix.assets[0]) });
      } catch (e) {
        setErreurGenerale((e as Error).message);
      }
    }
  }

  async function ajouterPhotos() {
    const choix = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: placesGalerie,
      quality: 0.85,
    });
    if (!choix.canceled) {
      try {
        const preparees = await Promise.all(
          choix.assets.slice(0, placesGalerie).map(preparerPhoto),
        );
        setNouvellesPhotos([...nouvellesPhotos, ...preparees]);
      } catch (e) {
        setErreurGenerale((e as Error).message);
      }
    }
  }

  // Après l'enregistrement des champs, on aligne les photos en ligne sur ce qui est affiché.
  async function synchroniserPhotos(id: string, jeton: string) {
    const ancienneCouverture = fiche?.imageUrl ?? null;
    if (couverture && 'locale' in couverture) {
      await envoyerPhoto('PUT', `/fiches/${id}/couverture`, jeton, couverture.locale);
    } else if (!couverture && ancienneCouverture) {
      await appeler('DELETE', `/fiches/${id}/couverture`, jeton);
    }
    const retirees = (fiche?.photos ?? []).filter((p) => !photosGardees.some((g) => g.id === p.id));
    for (const photo of retirees) {
      await appeler('DELETE', `/fiches/${id}/photos/${photo.id}`, jeton);
    }
    // Une photo après l'autre : l'ordre d'arrivée est l'ordre de la galerie.
    for (const photo of nouvellesPhotos) {
      await envoyerPhoto('POST', `/fiches/${id}/photos`, jeton, photo);
    }
  }

  async function valider(publier: boolean) {
    if (!session) {
      return;
    }
    setSoumis(true);
    setErreurGenerale(null);
    const resultat = creerFicheSchema.safeParse(versDto(saisie, publier));
    if (!resultat.success) {
      setErreurGenerale('Certains champs sont à corriger.');
      return;
    }
    setEnvoiEnCours(publier ? 'publier' : 'brouillon');
    let id: string | undefined;
    try {
      id = await enregistrer(resultat.data);
      await synchroniserPhotos(id, session.jeton);
      termine(id);
    } catch (e) {
      if (e instanceof ErreurApi && Object.keys(e.champs).length > 0) {
        setErreursServeur(e.champs);
      }
      const message = e instanceof ErreurApi ? e.message : 'Une erreur est survenue.';
      // Si les champs sont enregistrés mais pas une photo, on le dit clairement.
      setErreurGenerale(
        id ? `Fiche enregistrée, mais une photo n’a pas pu être envoyée : ${message}` : message,
      );
    } finally {
      setEnvoiEnCours(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.groupe}>
        <Text style={styles.libelle}>Photo de couverture</Text>
        {couverture ? (
          <View>
            <Image
              source={
                'url' in couverture ? adresseImage(couverture.url) : { uri: couverture.locale }
              }
              style={styles.couverture}
              contentFit="cover"
            />
            <View style={styles.actionsCouverture}>
              <Pressable
                onPress={choisirCouverture}
                style={styles.actionPhoto}
                accessibilityRole="button"
              >
                <Text style={styles.texteActionPhoto}>Changer</Text>
              </Pressable>
              <Pressable
                onPress={() => setCouverture(null)}
                style={styles.actionPhoto}
                accessibilityRole="button"
                accessibilityLabel="Retirer la photo de couverture"
              >
                <X size={16} color={couleurs.encre} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={choisirCouverture}
            style={styles.zonePhoto}
            accessibilityRole="button"
          >
            <ImagePlus size={26} color={couleurs.corail} />
            <Text style={styles.texteZonePhoto}>Ajouter une photo de couverture</Text>
            <Text style={styles.aidePhoto}>
              Sinon, une photo est choisie selon le type d’activité.
            </Text>
          </Pressable>
        )}
      </View>

      <ChampTexte libelle="Titre" placeholder="Loup-garou sous les étoiles" {...lier('titre')} />

      <View style={styles.groupe}>
        <Text style={styles.libelle}>Type d’activité</Text>
        <View style={styles.puces} accessibilityRole="radiogroup">
          {typesFiche.map((t) => (
            <Puce
              key={t}
              libelle={t === 'AUTRE' ? 'Autre : je le nomme' : libellesTypeFiche[t]}
              choisie={saisie.type === t}
              onPress={() => modifier('type', t)}
            />
          ))}
        </View>
        {erreurDe('type') && <Text style={styles.erreur}>{erreurDe('type')}</Text>}
      </View>
      {/* RG-21 : « Autre » devient le type que l'animateur invente. */}
      {saisie.type === 'AUTRE' && (
        <ChampTexte
          libelle="Nom de ton type d’activité"
          placeholder="Théâtre, jeu de piste, cuisine…"
          maxLength={40}
          {...lier('typePersonnalise')}
        />
      )}

      <View style={styles.ligne}>
        <View style={styles.moitie}>
          <ChampTexte
            libelle="Âge minimum"
            placeholder="6"
            keyboardType="number-pad"
            {...lier('ageMin')}
          />
        </View>
        <View style={styles.moitie}>
          <ChampTexte
            libelle="Âge maximum"
            placeholder="12"
            keyboardType="number-pad"
            {...lier('ageMax')}
          />
        </View>
      </View>

      <ChampTexte
        libelle="Durée (en minutes)"
        placeholder="60"
        keyboardType="number-pad"
        {...lier('dureeMinutes')}
      />

      <View style={styles.ligne}>
        <View style={styles.moitie}>
          <ChampTexte
            libelle="Participants min."
            placeholder="Facultatif"
            keyboardType="number-pad"
            {...lier('nbParticipantsMin')}
          />
        </View>
        <View style={styles.moitie}>
          <ChampTexte
            libelle="Participants max."
            placeholder="Facultatif"
            keyboardType="number-pad"
            {...lier('nbParticipantsMax')}
          />
        </View>
      </View>

      <ChampBulles
        libelle="Matériel"
        valeurs={saisie.materiel}
        suggestions={suggestionsMateriel}
        onChange={(materiel) => modifier('materiel', materiel)}
        maximum={30}
        placeholder="Ajouter du matériel…"
        erreur={erreurDe('materiel')}
      />
      <ChampBulles
        libelle="Objectifs"
        valeurs={saisie.objectifs}
        suggestions={suggestionsObjectifs}
        onChange={(objectifs) => modifier('objectifs', objectifs)}
        maximum={15}
        placeholder="Ajouter un objectif…"
        erreur={erreurDe('objectifs')}
      />

      <ChampTexte
        libelle="Déroulement"
        placeholder="Explique la mise en place, les règles et les variantes."
        multiline
        {...lier('deroulement')}
      />

      <View style={styles.groupe}>
        <Text style={styles.libelle}>
          Photos{' '}
          <Text style={styles.compte}>
            ({PHOTOS_PAR_FICHE - placesGalerie}/{PHOTOS_PAR_FICHE})
          </Text>
        </Text>
        <View style={styles.galerie}>
          {photosGardees.map((photo) => (
            <Vignette
              key={photo.id}
              source={adresseImage(photo.url)}
              retirer={() => setPhotosGardees(photosGardees.filter((p) => p.id !== photo.id))}
            />
          ))}
          {nouvellesPhotos.map((photo) => (
            <Vignette
              key={photo}
              source={{ uri: photo }}
              retirer={() => setNouvellesPhotos(nouvellesPhotos.filter((p) => p !== photo))}
            />
          ))}
          {placesGalerie > 0 && (
            <Pressable
              onPress={ajouterPhotos}
              style={[styles.vignette, styles.ajoutVignette]}
              accessibilityRole="button"
              accessibilityLabel="Ajouter des photos à la galerie"
            >
              <ImagePlus size={24} color={couleurs.corail} />
            </Pressable>
          )}
        </View>
      </View>

      {erreurGenerale && <MessageErreur message={erreurGenerale} />}

      {dejaPubliee ? (
        <Bouton
          titre="Enregistrer les modifications"
          onPress={() => valider(true)}
          chargement={envoiEnCours !== null}
        />
      ) : (
        <View style={styles.boutons}>
          <Bouton
            titre="Publier la fiche"
            onPress={() => valider(true)}
            chargement={envoiEnCours === 'publier'}
          />
          <Bouton
            titre="Enregistrer en brouillon"
            variante="secondaire"
            onPress={() => valider(false)}
            chargement={envoiEnCours === 'brouillon'}
          />
          <Text style={styles.note}>Publier ta fiche te rapporte 50 XP.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function Vignette({ source, retirer }: { source: ImageSource; retirer: () => void }) {
  return (
    <View>
      <Image source={source} style={styles.vignette} contentFit="cover" />
      <Pressable
        onPress={retirer}
        style={styles.retirerVignette}
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
  page: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: 20,
    padding: 20,
    paddingBottom: 40,
  },
  groupe: { gap: 8 },
  libelle: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  compte: { fontFamily: polices.texte, color: couleurs.encre2 },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  erreur: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.erreur },
  ligne: { flexDirection: 'row', gap: 12 },
  moitie: { flex: 1 },
  zonePhoto: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  texteZonePhoto: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  aidePhoto: {
    fontFamily: polices.texte,
    fontSize: 13,
    color: couleurs.encre2,
    textAlign: 'center',
  },
  couverture: { height: 200, borderRadius: 10, backgroundColor: couleurs.trait },
  actionsCouverture: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 8 },
  actionPhoto: {
    minHeight: 36,
    minWidth: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.surface,
  },
  texteActionPhoto: { fontFamily: polices.texteGras, fontSize: 14, color: couleurs.encre },
  galerie: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vignette: { width: 92, height: 92, borderRadius: 8, backgroundColor: couleurs.trait },
  ajoutVignette: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  retirerVignette: {
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
  boutons: { gap: 10 },
  note: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2, textAlign: 'center' },
});
