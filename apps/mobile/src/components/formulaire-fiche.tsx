import {
  creerFicheSchema,
  libellesTypeFiche,
  typesFiche,
  type CreerFicheDto,
  type FicheDetail,
  type TypeFiche,
} from '@ramdam/shared';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bouton } from '@/components/bouton';
import { ChampTexte } from '@/components/champ-texte';
import { MessageErreur } from '@/components/message-erreur';
import { Puce } from '@/components/puce';
import { couleurs, polices } from '@/constants/theme';
import { ErreurApi } from '@/lib/api';
import { erreursDuFormulaire } from '@/lib/validation';

// Les champs du formulaire sont des textes (ce que contient un TextInput) ;
// ils sont convertis en nombres au moment de valider.
type Saisie = {
  titre: string;
  type: TypeFiche | undefined;
  ageMin: string;
  ageMax: string;
  dureeMinutes: string;
  nbParticipantsMin: string;
  nbParticipantsMax: string;
  objectifs: string;
  materiel: string;
  deroulement: string;
};
type Champ = keyof Saisie;

// Champ vide → null : Zod dira « obligatoire » pour un âge, ou videra un champ facultatif.
const enNombre = (texte: string) => (texte.trim() === '' ? null : Number(texte.replace(',', '.')));
const enTexte = (nombre: number | null | undefined) => (nombre == null ? '' : String(nombre));

function versDto(saisie: Saisie, publier: boolean) {
  return {
    titre: saisie.titre,
    type: saisie.type,
    ageMin: enNombre(saisie.ageMin),
    ageMax: enNombre(saisie.ageMax),
    dureeMinutes: enNombre(saisie.dureeMinutes),
    nbParticipantsMin: enNombre(saisie.nbParticipantsMin),
    nbParticipantsMax: enNombre(saisie.nbParticipantsMax),
    objectifs: saisie.objectifs,
    materiel: saisie.materiel,
    deroulement: saisie.deroulement,
    publier,
  };
}

type Props = {
  // Fiche existante en cas de modification, absente pour une création.
  fiche?: FicheDetail;
  envoyer: (dto: CreerFicheDto) => Promise<void>;
};

// Formulaire commun à la création et à la modification d'une fiche.
export function FormulaireFiche({ fiche, envoyer }: Props) {
  const [saisie, setSaisie] = useState<Saisie>({
    titre: fiche?.titre ?? '',
    type: fiche?.type,
    ageMin: enTexte(fiche?.ageMin),
    ageMax: enTexte(fiche?.ageMax),
    dureeMinutes: enTexte(fiche?.dureeMinutes),
    nbParticipantsMin: enTexte(fiche?.nbParticipantsMin),
    nbParticipantsMax: enTexte(fiche?.nbParticipantsMax),
    objectifs: fiche?.objectifs ?? '',
    materiel: fiche?.materiel ?? '',
    deroulement: fiche?.deroulement ?? '',
  });
  const [champsQuittes, setChampsQuittes] = useState<Partial<Record<Champ, boolean>>>({});
  const [soumis, setSoumis] = useState(false);
  const [erreursServeur, setErreursServeur] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState<'publier' | 'brouillon' | null>(null);

  // Une fiche déjà publiée ne redevient pas brouillon : un seul bouton « Enregistrer ».
  const dejaPubliee = fiche !== undefined && fiche.statut !== 'BROUILLON';
  const erreurs = erreursDuFormulaire(creerFicheSchema, versDto(saisie, true));

  function erreurDe(champ: Champ) {
    if (erreursServeur[champ]) {
      return erreursServeur[champ];
    }
    return soumis || champsQuittes[champ] ? erreurs[champ] : undefined;
  }

  function modifier(champ: Champ, valeur: string | TypeFiche) {
    setSaisie({ ...saisie, [champ]: valeur });
    setErreursServeur({ ...erreursServeur, [champ]: '' });
  }

  // Propriétés communes à chaque champ : valeur, saisie, sortie du champ et erreur.
  const lier = (champ: Exclude<Champ, 'type'>) => ({
    value: saisie[champ],
    onChangeText: (texte: string) => modifier(champ, texte),
    onBlur: () => setChampsQuittes({ ...champsQuittes, [champ]: true }),
    erreur: erreurDe(champ),
  });

  async function valider(publier: boolean) {
    setSoumis(true);
    setErreurGenerale(null);
    const resultat = creerFicheSchema.safeParse(versDto(saisie, publier));
    if (!resultat.success) {
      setErreurGenerale('Certains champs sont à corriger.');
      return;
    }
    setEnvoiEnCours(publier ? 'publier' : 'brouillon');
    try {
      await envoyer(resultat.data);
    } catch (e) {
      if (e instanceof ErreurApi && Object.keys(e.champs).length > 0) {
        setErreursServeur(e.champs);
      }
      setErreurGenerale(e instanceof ErreurApi ? e.message : 'Une erreur est survenue.');
    } finally {
      setEnvoiEnCours(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <ChampTexte libelle="Titre" placeholder="Loup-garou sous les étoiles" {...lier('titre')} />

      <View style={styles.groupe}>
        <Text style={styles.libelle}>Type d’activité</Text>
        <View style={styles.puces} accessibilityRole="radiogroup">
          {typesFiche.map((t) => (
            <Puce
              key={t}
              libelle={libellesTypeFiche[t]}
              choisie={saisie.type === t}
              onPress={() => modifier('type', t)}
            />
          ))}
        </View>
        {erreurDe('type') && <Text style={styles.erreur}>{erreurDe('type')}</Text>}
      </View>

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

      <ChampTexte
        libelle="Objectifs"
        placeholder="Facultatif : coopérer, se repérer dans l'espace…"
        multiline
        {...lier('objectifs')}
      />
      <ChampTexte
        libelle="Matériel"
        placeholder="Facultatif : cartes, foulards, lampes…"
        multiline
        {...lier('materiel')}
      />
      <ChampTexte
        libelle="Déroulement"
        placeholder="Explique la mise en place, les règles et les variantes."
        multiline
        {...lier('deroulement')}
      />

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

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: 18,
    padding: 20,
    paddingBottom: 40,
  },
  groupe: { gap: 8 },
  libelle: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  erreur: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.erreur },
  ligne: { flexDirection: 'row', gap: 12 },
  moitie: { flex: 1 },
  boutons: { gap: 10 },
  note: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2, textAlign: 'center' },
});
