import { inscriptionSchema, type InscriptionDto } from '@ramdam/shared';
import { Link } from 'expo-router';
import { AtSign, Backpack, Lock, Mail, Megaphone } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { Bouton } from '@/components/bouton';
import { CarteChoix } from '@/components/carte-choix';
import { CaseACocher } from '@/components/case-a-cocher';
import { ChampTexte } from '@/components/champ-texte';
import { EcranAuth } from '@/components/ecran-auth';
import { MessageErreur } from '@/components/message-erreur';
import { ReglesMotDePasse } from '@/components/regles-mot-de-passe';
import { texte } from '@/constants/styles-communs';
import { couleurs, polices } from '@/constants/theme';
import { ErreurApi } from '@/lib/api';
import { erreursDuFormulaire } from '@/lib/validation';
import { useEcranLarge } from '@/hooks/use-ecran-large';
import { useSession } from '@/session/session-context';

type Champ = keyof InscriptionDto;

export default function Inscription() {
  const { inscrire } = useSession();
  const ecranLarge = useEcranLarge();
  const [valeurs, setValeurs] = useState({
    email: '',
    pseudo: '',
    motDePasse: '',
    role: 'ANIMATEUR' as InscriptionDto['role'],
    cguAcceptees: false,
  });
  const [champsQuittes, setChampsQuittes] = useState<Partial<Record<Champ, boolean>>>({});
  const [soumis, setSoumis] = useState(false);
  const [erreursServeur, setErreursServeur] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const champPseudo = useRef<TextInputInstance>(null);
  const champMotDePasse = useRef<TextInputInstance>(null);

  const erreurs = erreursDuFormulaire(inscriptionSchema, valeurs);

  // Une erreur s'affiche quand on a quitté le champ ou tenté d'envoyer,
  // jamais pendant que la personne est encore en train d'écrire.
  function erreurDe(champ: Champ) {
    if (erreursServeur[champ]) {
      return erreursServeur[champ];
    }
    return soumis || champsQuittes[champ] ? erreurs[champ] : undefined;
  }

  function modifier<C extends Champ>(champ: C, valeur: (typeof valeurs)[C]) {
    setValeurs({ ...valeurs, [champ]: valeur });
    setErreursServeur({ ...erreursServeur, [champ]: '' });
  }

  function quitter(champ: Champ) {
    setChampsQuittes({ ...champsQuittes, [champ]: true });
  }

  async function creerCompte() {
    setSoumis(true);
    setErreurGenerale(null);
    const resultat = inscriptionSchema.safeParse(valeurs);
    if (!resultat.success) {
      return;
    }

    setEnvoiEnCours(true);
    try {
      // En cas de succès, la session change et la navigation ouvre l'accueil toute seule.
      await inscrire(resultat.data);
    } catch (erreur) {
      if (erreur instanceof ErreurApi && Object.keys(erreur.champs).length > 0) {
        setErreursServeur(erreur.champs);
      } else {
        setErreurGenerale(
          erreur instanceof ErreurApi ? erreur.message : 'Une erreur est survenue.',
        );
      }
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <EcranAuth
      titre="Créer un compte"
      intro="Partage tes activités et trouve ta prochaine équipe d'anim."
      photo={{
        source: require('@/assets/images/photos/fresque.jpg'),
        credit: 'Yann, CC BY-SA 4.0',
      }}
      pied={
        <Text style={texte.courant}>
          Déjà inscrit ?{' '}
          <Link href="/connexion" replace style={texte.lien}>
            Se connecter
          </Link>
        </Text>
      }
    >
      {/* Sur grand écran, email et pseudo côte à côte pour que tout tienne sans défilement. */}
      <View style={ecranLarge ? styles.ligne : styles.groupeChamps}>
        <View style={ecranLarge && styles.moitie}>
          <ChampTexte
            libelle="Email"
            icone={Mail}
            placeholder="lea@exemple.fr"
            value={valeurs.email}
            onChangeText={(email) => modifier('email', email)}
            onBlur={() => quitter('email')}
            erreur={erreurDe('email')}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => champPseudo.current?.focus()}
          />
        </View>
        <View style={ecranLarge && styles.moitie}>
          <ChampTexte
            ref={champPseudo}
            libelle="Pseudo"
            icone={AtSign}
            placeholder="lea.anim"
            value={valeurs.pseudo}
            onChangeText={(pseudo) => modifier('pseudo', pseudo)}
            onBlur={() => quitter('pseudo')}
            erreur={erreurDe('pseudo')}
            autoComplete="username-new"
            textContentType="username"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => champMotDePasse.current?.focus()}
          />
        </View>
      </View>

      <ChampTexte
        ref={champMotDePasse}
        libelle="Mot de passe"
        icone={Lock}
        motDePasse
        value={valeurs.motDePasse}
        onChangeText={(motDePasse) => modifier('motDePasse', motDePasse)}
        onBlur={() => quitter('motDePasse')}
        erreur={erreurDe('motDePasse')}
        aide={<ReglesMotDePasse motDePasse={valeurs.motDePasse} erreur={erreurDe('motDePasse')} />}
        autoComplete="new-password"
        textContentType="newPassword"
        // Indique au gestionnaire de mots de passe d'iOS quoi générer.
        passwordRules="minlength: 12; required: lower; required: upper; required: digit; required: special;"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />

      <View style={styles.groupe}>
        <Text style={styles.libelle}>Type de compte</Text>
        <View style={styles.cartes} accessibilityRole="radiogroup">
          <CarteChoix
            titre="Animateur"
            description="Je partage des activités"
            icone={Backpack}
            choisie={valeurs.role === 'ANIMATEUR'}
            onPress={() => modifier('role', 'ANIMATEUR')}
          />
          <CarteChoix
            titre="Directeur"
            description="Je publie aussi des offres"
            icone={Megaphone}
            choisie={valeurs.role === 'DIRECTEUR'}
            onPress={() => modifier('role', 'DIRECTEUR')}
          />
        </View>
      </View>

      <View style={styles.groupe}>
        <CaseACocher
          cochee={valeurs.cguAcceptees}
          onChange={(cochee) => modifier('cguAcceptees', cochee)}
          enErreur={erreurDe('cguAcceptees') !== undefined}
        >
          <Text style={texte.courant}>
            J'accepte les <Text style={styles.gras}>conditions d'utilisation</Text> et la{' '}
            <Text style={styles.gras}>politique de confidentialité</Text>
          </Text>
        </CaseACocher>
        {erreurDe('cguAcceptees') && (
          <Text style={styles.erreurCgu}>{erreurDe('cguAcceptees')}</Text>
        )}
      </View>

      {erreurGenerale && <MessageErreur message={erreurGenerale} />}

      <Bouton titre="Créer mon compte" onPress={creerCompte} chargement={envoiEnCours} />
    </EcranAuth>
  );
}

const styles = StyleSheet.create({
  groupe: { gap: 8 },
  groupeChamps: { gap: 20 },
  ligne: { flexDirection: 'row', gap: 12 },
  moitie: { flex: 1 },
  libelle: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  cartes: { flexDirection: 'row', gap: 12 },
  gras: { fontFamily: polices.texteMoyen, color: couleurs.encre },
  erreurCgu: {
    marginLeft: 36,
    fontFamily: polices.texteMoyen,
    fontSize: 14,
    color: couleurs.erreur,
  },
});
