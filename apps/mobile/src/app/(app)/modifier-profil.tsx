import { modifierProfilSchema, type Profil } from '@ramdam/shared';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Bouton } from '@/components/bouton';
import { ChampTexte } from '@/components/champ-texte';
import { MessageErreur } from '@/components/message-erreur';
import { useToast } from '@/components/toast';
import { couleurs, polices } from '@/constants/theme';
import { appeler, envoyerPhoto, ErreurApi, lire } from '@/lib/api';
import { confirmer } from '@/lib/confirmer';
import { preparerPhoto } from '@/lib/photos';
import { useSession } from '@/session/session-context';

const BIO_MAX = 300;

// Modifier son profil : photo, bio, et suppression du compte (RGPD).
// Toutes les routes visent /profils/moi : on ne peut modifier que son propre compte.
export default function ModifierProfil() {
  const { session, deconnecter } = useSession();
  const afficherToast = useToast();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [bio, setBio] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [action, setAction] = useState<'photo' | 'bio' | 'suppression' | null>(null);
  const [motDePasse, setMotDePasse] = useState('');
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }
    lire<Profil>('/profils/moi', session.jeton)
      .then((donnees) => {
        setProfil(donnees);
        setBio(donnees.bio ?? '');
      })
      .catch(() => setErreur('Impossible de charger ton profil.'));
  }, [session]);

  if (!session || !profil) {
    return (
      <View style={styles.centre}>
        {erreur ? (
          <MessageErreur message={erreur} />
        ) : (
          <ActivityIndicator color={couleurs.corail} accessibilityLabel="Chargement" />
        )}
      </View>
    );
  }
  const jeton = session.jeton;

  // La photo est envoyée tout de suite, sans attendre « Enregistrer ».
  async function changerPhoto() {
    const choix = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // dans l'app : recadrage carré avant l'envoi
      aspect: [1, 1],
      quality: 0.85,
    });
    if (choix.canceled) {
      return;
    }
    setAction('photo');
    setErreur(null);
    try {
      const photo = await preparerPhoto(choix.assets[0]);
      setProfil(await envoyerPhoto<Profil>('PUT', '/profils/moi/avatar', jeton, photo));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'La photo n’a pas pu être envoyée.');
    } finally {
      setAction(null);
    }
  }

  async function retirerPhoto() {
    setAction('photo');
    try {
      setProfil(await appeler<Profil>('DELETE', '/profils/moi/avatar', jeton));
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : 'La photo n’a pas pu être retirée.');
    } finally {
      setAction(null);
    }
  }

  async function enregistrerBio() {
    // Même schéma Zod que l'API.
    const resultat = modifierProfilSchema.safeParse({ bio });
    if (!resultat.success) {
      setErreur(resultat.error.issues[0].message);
      return;
    }
    setAction('bio');
    try {
      await appeler('PUT', '/profils/moi', jeton, resultat.data);
      afficherToast('Profil enregistré');
      router.back();
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : 'Le profil n’a pas pu être enregistré.');
      setAction(null);
    }
  }

  async function supprimerCompte() {
    if (!motDePasse) {
      setErreurSuppression('Entre ton mot de passe pour confirmer.');
      return;
    }
    const ok = await confirmer(
      'Supprimer ton compte ?',
      'Tes fiches, offres, commentaires, photos et ton XP seront effacés. C’est définitif.',
      'Supprimer mon compte',
    );
    if (!ok) {
      return;
    }
    setAction('suppression');
    setErreurSuppression(null);
    try {
      await appeler('DELETE', '/profils/moi', jeton, { motDePasse });
      // Le compte n'existe plus : on oublie la session, retour à l'écran de connexion.
      await deconnecter();
    } catch (e) {
      setErreurSuppression(
        e instanceof ErreurApi ? e.message : 'Le compte n’a pas pu être supprimé.',
      );
      setAction(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.photo}>
        <Avatar pseudo={profil.pseudo} url={profil.avatarUrl} taille={120} />
        <View style={styles.actionsPhoto}>
          <Pressable
            onPress={changerPhoto}
            style={styles.actionPhoto}
            accessibilityRole="button"
            disabled={action === 'photo'}
          >
            {action === 'photo' ? (
              <ActivityIndicator color={couleurs.encre} />
            ) : (
              <Camera size={18} color={couleurs.encre} />
            )}
            <Text style={styles.texteAction}>
              {profil.avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </Text>
          </Pressable>
          {profil.avatarUrl && (
            <Pressable
              onPress={retirerPhoto}
              style={styles.actionPhoto}
              accessibilityRole="button"
              accessibilityLabel="Retirer la photo de profil"
            >
              <Trash2 size={18} color={couleurs.erreur} />
            </Pressable>
          )}
        </View>
      </View>

      <ChampTexte
        libelle="Bio"
        placeholder="Animateur depuis 2019, fan de grands jeux et de veillées contes…"
        multiline
        maxLength={BIO_MAX}
        value={bio}
        onChangeText={(texte) => {
          setBio(texte);
          setErreur(null);
        }}
        aide={
          <Text style={styles.compteur}>
            {bio.length}/{BIO_MAX}
          </Text>
        }
      />

      {erreur && <MessageErreur message={erreur} />}
      <Bouton titre="Enregistrer" onPress={enregistrerBio} chargement={action === 'bio'} />

      {/* RGPD : droit à l'effacement. */}
      <View style={styles.zoneSensible}>
        <Text style={styles.titreZone} accessibilityRole="header">
          Supprimer mon compte
        </Text>
        <Text style={styles.explication}>
          Ton compte et tout ce que tu as publié seront effacés : fiches, offres, commentaires,
          photos et XP. Cette action est définitive.
        </Text>
        <ChampTexte
          libelle="Mot de passe"
          motDePasse
          autoComplete="current-password"
          value={motDePasse}
          onChangeText={(texte) => {
            setMotDePasse(texte);
            setErreurSuppression(null);
          }}
          erreur={erreurSuppression ?? undefined}
        />
        <Bouton
          titre="Supprimer définitivement"
          variante="danger"
          onPress={supprimerCompte}
          chargement={action === 'suppression'}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: couleurs.fond,
  },
  page: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: 20,
    padding: 20,
    paddingBottom: 48,
  },
  photo: { alignItems: 'center', gap: 14 },
  actionsPhoto: { flexDirection: 'row', gap: 10 },
  actionPhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  texteAction: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  compteur: {
    alignSelf: 'flex-end',
    fontFamily: polices.texte,
    fontSize: 13,
    color: couleurs.encre2,
  },
  zoneSensible: {
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: couleurs.trait,
  },
  titreZone: { fontFamily: polices.titre, fontSize: 19, color: couleurs.erreur },
  explication: { fontFamily: polices.texte, fontSize: 14, lineHeight: 20, color: couleurs.encre2 },
});
