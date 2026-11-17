import {
  libellesTypeStructure,
  offreSchema,
  regions,
  suggestionsDiplome,
  typesStructure,
  type OffreDetail,
  type OffreDto,
  type Region,
  type TypeStructure,
} from '@ramdam/shared';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bouton } from '@/components/bouton';
import { ChampTexte } from '@/components/champ-texte';
import { MessageErreur } from '@/components/message-erreur';
import { Puce } from '@/components/puce';
import { couleurs, polices } from '@/constants/theme';
import { ErreurApi } from '@/lib/api';
import { erreursDuFormulaire } from '@/lib/validation';

// Les dates sont saisies à la française (14/07/2027) et envoyées à l'API en AAAA-MM-JJ.
// Une saisie incomplète est envoyée telle quelle : Zod affichera « Date invalide ».
function versIso(texte: string) {
  const morceaux = texte.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!morceaux) {
    return texte.trim();
  }
  const [, jour, mois, annee] = morceaux;
  return `${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`;
}
const versFrancais = (iso: string) => iso.split('-').reverse().join('/');

type Saisie = {
  intitule: string;
  structure: string;
  typeStructure: TypeStructure | undefined;
  region: Region | undefined;
  dateDebut: string;
  dateFin: string;
  description: string;
  diplomeRequis: string;
  contactExterne: string;
};
type Champ = keyof Saisie;

function versDto(saisie: Saisie) {
  return {
    ...saisie,
    dateDebut: versIso(saisie.dateDebut),
    dateFin: versIso(saisie.dateFin),
    diplomeRequis: saisie.diplomeRequis.trim() || null,
  };
}

type Props = {
  // Offre existante en cas de modification, absente pour une publication.
  offre?: OffreDetail;
  // Envoie l'offre (POST ou PUT) et renvoie son identifiant.
  enregistrer: (dto: OffreDto) => Promise<string>;
  termine: (id: string) => void;
};

// Formulaire commun à la publication et à la modification d'une offre (réservé aux Directeurs).
export function FormulaireOffre({ offre, enregistrer, termine }: Props) {
  const [saisie, setSaisie] = useState<Saisie>({
    intitule: offre?.intitule ?? '',
    structure: offre?.structure ?? '',
    typeStructure: offre?.typeStructure,
    region: regions.find((r) => r === offre?.region),
    dateDebut: offre ? versFrancais(offre.dateDebut) : '',
    dateFin: offre ? versFrancais(offre.dateFin) : '',
    description: offre?.description ?? '',
    diplomeRequis: offre?.diplomeRequis ?? '',
    contactExterne: offre?.contactExterne ?? '',
  });
  const [champsQuittes, setChampsQuittes] = useState<Partial<Record<Champ, boolean>>>({});
  const [soumis, setSoumis] = useState(false);
  const [erreursServeur, setErreursServeur] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Même schéma Zod que l'API : les erreurs s'affichent avant même d'envoyer.
  const erreurs = erreursDuFormulaire(offreSchema, versDto(saisie));

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
      | 'intitule'
      | 'structure'
      | 'dateDebut'
      | 'dateFin'
      | 'description'
      | 'diplomeRequis'
      | 'contactExterne',
  ) => ({
    value: saisie[champ],
    onChangeText: (texte: string) => modifier(champ, texte),
    onBlur: () => setChampsQuittes({ ...champsQuittes, [champ]: true }),
    erreur: erreurDe(champ),
  });

  async function valider() {
    setSoumis(true);
    setErreurGenerale(null);
    const resultat = offreSchema.safeParse(versDto(saisie));
    if (!resultat.success) {
      setErreurGenerale('Certains champs sont à corriger.');
      return;
    }
    setEnvoi(true);
    try {
      termine(await enregistrer(resultat.data));
    } catch (e) {
      if (e instanceof ErreurApi && Object.keys(e.champs).length > 0) {
        setErreursServeur(e.champs);
      }
      setErreurGenerale(e instanceof ErreurApi ? e.message : 'Une erreur est survenue.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <ChampTexte
        libelle="Intitulé du poste"
        placeholder="Animateur·rice séjour montagne"
        maxLength={120}
        {...lier('intitule')}
      />
      <ChampTexte
        libelle="Structure"
        placeholder="Centre de vacances Les Chamois"
        maxLength={120}
        {...lier('structure')}
      />

      <Groupe libelle="Type de structure" erreur={erreurDe('typeStructure')}>
        {typesStructure.map((t) => (
          <Puce
            key={t}
            libelle={libellesTypeStructure[t]}
            choisie={saisie.typeStructure === t}
            onPress={() => modifier('typeStructure', t)}
          />
        ))}
      </Groupe>

      <Groupe libelle="Région" erreur={erreurDe('region')}>
        {regions.map((r) => (
          <Puce
            key={r}
            libelle={r}
            choisie={saisie.region === r}
            onPress={() => modifier('region', r)}
          />
        ))}
      </Groupe>

      <View style={styles.ligne}>
        <View style={styles.moitie}>
          <ChampTexte
            libelle="Début"
            placeholder="05/07/2027"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            {...lier('dateDebut')}
          />
        </View>
        <View style={styles.moitie}>
          <ChampTexte
            libelle="Fin"
            placeholder="26/07/2027"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            {...lier('dateFin')}
          />
        </View>
      </View>

      <ChampTexte
        libelle="Le poste"
        placeholder="Public, missions, rythme, hébergement, rémunération…"
        multiline
        maxLength={5000}
        {...lier('description')}
      />

      <View style={styles.groupe}>
        <ChampTexte
          libelle="Diplôme demandé (facultatif)"
          placeholder="BAFA"
          maxLength={60}
          {...lier('diplomeRequis')}
        />
        <View style={styles.puces}>
          {suggestionsDiplome.map((d) => (
            <Puce
              key={d}
              libelle={d}
              choisie={saisie.diplomeRequis === d}
              onPress={() => modifier('diplomeRequis', saisie.diplomeRequis === d ? '' : d)}
            />
          ))}
        </View>
      </View>

      <ChampTexte
        libelle="Pour candidater"
        placeholder="recrutement@structure.fr ou https://…"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        maxLength={255}
        aide={
          erreurDe('contactExterne') ? undefined : (
            <Text style={styles.note}>
              Les candidatures se font hors de Ramdam : un e-mail ou le lien de ton site.
            </Text>
          )
        }
        {...lier('contactExterne')}
      />

      {erreurGenerale && <MessageErreur message={erreurGenerale} />}
      <Bouton
        titre={offre ? 'Enregistrer les modifications' : 'Publier l’offre'}
        onPress={valider}
        chargement={envoi}
      />
    </ScrollView>
  );
}

function Groupe({
  libelle,
  erreur,
  children,
}: {
  libelle: string;
  erreur?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.groupe}>
      <Text style={styles.libelle}>{libelle}</Text>
      <View style={styles.puces} accessibilityRole="radiogroup">
        {children}
      </View>
      {erreur && <Text style={styles.erreur}>{erreur}</Text>}
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
    paddingBottom: 48,
  },
  groupe: { gap: 8 },
  libelle: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  erreur: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.erreur },
  ligne: { flexDirection: 'row', gap: 12 },
  moitie: { flex: 1 },
  note: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
});
