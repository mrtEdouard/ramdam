import { connexionSchema, type ConnexionDto } from '@ramdam/shared';
import { Link } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Text, type TextInputInstance } from 'react-native';
import { Bouton } from '@/components/bouton';
import { ChampTexte } from '@/components/champ-texte';
import { EcranAuth } from '@/components/ecran-auth';
import { MessageErreur } from '@/components/message-erreur';
import { texte } from '@/constants/styles-communs';
import { ErreurApi } from '@/lib/api';
import { erreursDuFormulaire } from '@/lib/validation';
import { useSession } from '@/session/session-context';

type Champ = keyof ConnexionDto;

export default function Connexion() {
  const { connecter } = useSession();
  const [valeurs, setValeurs] = useState<ConnexionDto>({ email: '', motDePasse: '' });
  const [champsQuittes, setChampsQuittes] = useState<Partial<Record<Champ, boolean>>>({});
  const [soumis, setSoumis] = useState(false);
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const champMotDePasse = useRef<TextInputInstance>(null);

  const erreurs = erreursDuFormulaire(connexionSchema, valeurs);

  function erreurDe(champ: Champ) {
    return soumis || champsQuittes[champ] ? erreurs[champ] : undefined;
  }

  async function seConnecter() {
    setSoumis(true);
    setErreurGenerale(null);
    const resultat = connexionSchema.safeParse(valeurs);
    if (!resultat.success) {
      return;
    }

    setEnvoiEnCours(true);
    try {
      await connecter(resultat.data);
    } catch (erreur) {
      // L'API renvoie le même message pour un email inconnu ou un mauvais mot de passe.
      setErreurGenerale(erreur instanceof ErreurApi ? erreur.message : 'Une erreur est survenue.');
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <EcranAuth
      titre="Te revoilà"
      intro="Connecte-toi pour retrouver tes fiches et ta Malle."
      photo={{
        source: require('@/assets/images/photos/veillee.jpg'),
        credit: 'Smiley.toerist, CC BY-SA 3.0',
      }}
      pied={
        <Text style={texte.courant}>
          Pas encore de compte ?{' '}
          <Link href="/inscription" replace style={texte.lien}>
            Créer un compte
          </Link>
        </Text>
      }
    >
      <ChampTexte
        libelle="Email"
        icone={Mail}
        placeholder="lea@exemple.fr"
        value={valeurs.email}
        onChangeText={(email) => setValeurs({ ...valeurs, email })}
        onBlur={() => setChampsQuittes({ ...champsQuittes, email: true })}
        erreur={erreurDe('email')}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="username"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => champMotDePasse.current?.focus()}
      />

      <ChampTexte
        ref={champMotDePasse}
        libelle="Mot de passe"
        icone={Lock}
        motDePasse
        value={valeurs.motDePasse}
        onChangeText={(motDePasse) => setValeurs({ ...valeurs, motDePasse })}
        onBlur={() => setChampsQuittes({ ...champsQuittes, motDePasse: true })}
        erreur={erreurDe('motDePasse')}
        autoComplete="current-password"
        textContentType="password"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={seConnecter}
      />

      {erreurGenerale && <MessageErreur message={erreurGenerale} />}

      <Bouton titre="Se connecter" onPress={seConnecter} chargement={envoiEnCours} />
    </EcranAuth>
  );
}
