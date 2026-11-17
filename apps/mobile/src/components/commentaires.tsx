import {
  commentaireSchema,
  type Commentaire,
  type CommentaireEnvoye,
  type Reponse,
} from '@ramdam/shared';
import { Link } from 'expo-router';
import { SendHorizontal, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { MessageErreur } from '@/components/message-erreur';
import { useToast } from '@/components/toast';
import { couleurs, polices } from '@/constants/theme';
import { useRequete } from '@/hooks/use-requete';
import { appeler, ErreurApi } from '@/lib/api';
import { confirmer } from '@/lib/confirmer';
import { depuis } from '@/lib/format';
import { useSession } from '@/session/session-context';

// Commentaires sous une fiche publiée, avec un niveau de réponses (RG-11).
// Le champ d'écriture est en haut ; « Répondre » le fait passer en mode réponse.
export function Commentaires({ ficheId }: { ficheId: string }) {
  const { session } = useSession();
  const afficherToast = useToast();
  const { donnees: commentaires, recharger } = useRequete<Commentaire[]>(
    `/fiches/${ficheId}/commentaires`,
  );
  const [texte, setTexte] = useState('');
  // Le commentaire auquel on répond, ou null pour un nouveau commentaire.
  const [reponseA, setReponseA] = useState<{ id: string; auteur: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    // Même schéma Zod que l'API : le message d'erreur s'affiche sans aller-retour.
    const resultat = commentaireSchema.safeParse({ contenu: texte, parentId: reponseA?.id });
    if (!resultat.success) {
      setErreur(resultat.error.issues[0].message);
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      const { xpGagne } = await appeler<CommentaireEnvoye>(
        'POST',
        `/fiches/${ficheId}/commentaires`,
        session!.jeton,
        resultat.data,
      );
      setTexte('');
      setReponseA(null);
      await recharger();
      if (xpGagne > 0) {
        afficherToast(`+${xpGagne} XP pour ton commentaire`);
      }
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : 'Impossible d’envoyer ton commentaire.');
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(commentaire: Reponse) {
    const ok = await confirmer(
      'Supprimer ce commentaire ?',
      'Les réponses qu’il a reçues seront supprimées aussi.',
      'Supprimer',
    );
    if (!ok) {
      return;
    }
    try {
      await appeler('DELETE', `/fiches/${ficheId}/commentaires/${commentaire.id}`, session!.jeton);
      await recharger();
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : 'Impossible de supprimer le commentaire.');
    }
  }

  const nombre =
    commentaires?.reduce((total, commentaire) => total + 1 + commentaire.reponses.length, 0) ?? 0;

  return (
    <View style={styles.section}>
      <Text style={styles.titre} accessibilityRole="header">
        Commentaires{nombre > 0 ? ` (${nombre})` : ''}
      </Text>

      {reponseA && (
        <View style={styles.bandeauReponse}>
          <Text style={styles.texteBandeau}>
            Réponse à <Text style={styles.gras}>{reponseA.auteur}</Text>
          </Text>
          <Pressable
            onPress={() => setReponseA(null)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Annuler la réponse"
          >
            <X size={18} color={couleurs.encre2} />
          </Pressable>
        </View>
      )}
      <View style={styles.saisie}>
        <TextInput
          value={texte}
          onChangeText={setTexte}
          placeholder={
            reponseA ? `Ta réponse à ${reponseA.auteur}…` : 'Un retour, une astuce, une variante…'
          }
          placeholderTextColor={couleurs.encre3}
          multiline
          maxLength={1000}
          style={styles.champ}
          accessibilityLabel={reponseA ? `Répondre à ${reponseA.auteur}` : 'Écrire un commentaire'}
        />
        <Pressable
          onPress={envoyer}
          disabled={envoi || texte.trim().length === 0}
          style={[styles.envoyer, texte.trim().length === 0 && styles.envoyerInactif]}
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
        >
          {envoi ? (
            <ActivityIndicator color={couleurs.surface} size="small" />
          ) : (
            <SendHorizontal size={20} color={couleurs.surface} strokeWidth={2} />
          )}
        </Pressable>
      </View>
      {erreur && <MessageErreur message={erreur} />}

      {commentaires?.length === 0 && (
        <Text style={styles.vide}>Pas encore de commentaire. Tu l’as testée ? Raconte !</Text>
      )}

      {commentaires?.map((commentaire) => (
        <View key={commentaire.id} style={styles.fil}>
          <Message
            message={commentaire}
            onRepondre={() => setReponseA({ id: commentaire.id, auteur: commentaire.auteur })}
            onSupprimer={() => supprimer(commentaire)}
          />
          {/* Les réponses sont décalées et reliées par un trait, comme une note en marge. */}
          {commentaire.reponses.length > 0 && (
            <View style={styles.reponses}>
              {commentaire.reponses.map((reponse) => (
                <Message
                  key={reponse.id}
                  message={reponse}
                  petit
                  // Répondre à une réponse continue la même conversation.
                  onRepondre={() => setReponseA({ id: commentaire.id, auteur: reponse.auteur })}
                  onSupprimer={() => supprimer(reponse)}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

type PropsMessage = {
  message: Reponse;
  petit?: boolean;
  onRepondre: () => void;
  onSupprimer: () => void;
};

function Message({ message, petit = false, onRepondre, onSupprimer }: PropsMessage) {
  return (
    <View style={styles.message}>
      <Link
        href={{ pathname: '/profils/[pseudo]', params: { pseudo: message.auteur } }}
        accessibilityLabel={`Profil de ${message.auteur}`}
      >
        <Avatar pseudo={message.auteur} taille={petit ? 28 : 34} />
      </Link>
      <View style={styles.corps}>
        <Text style={styles.entete}>
          <Link
            href={{ pathname: '/profils/[pseudo]', params: { pseudo: message.auteur } }}
            style={styles.gras}
          >
            {message.auteur}
          </Link>
          <Text style={styles.date}> · {depuis(new Date(message.creeLe))}</Text>
        </Text>
        <Text style={styles.contenu}>{message.contenu}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onRepondre} hitSlop={8} accessibilityRole="button">
            <Text style={styles.action}>Répondre</Text>
          </Pressable>
          {message.estAMoi && (
            <Pressable onPress={onSupprimer} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.action, styles.actionDanger]}>Supprimer</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, paddingTop: 18, borderTopWidth: 1, borderColor: couleurs.trait },
  titre: {
    fontFamily: polices.titre,
    fontSize: 19,
    letterSpacing: -0.4,
    color: couleurs.encre,
  },
  bandeauReponse: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -6,
  },
  texteBandeau: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
  saisie: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  champ: {
    flex: 1,
    minHeight: 46,
    maxHeight: 140,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
    fontFamily: polices.texte,
    fontSize: 15,
    color: couleurs.encre,
  },
  envoyer: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.corail,
  },
  envoyerInactif: { opacity: 0.4 },
  vide: { fontFamily: polices.texte, fontSize: 15, color: couleurs.encre2 },
  fil: { gap: 10, paddingTop: 4 },
  reponses: {
    gap: 10,
    marginLeft: 16,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderColor: couleurs.trait,
  },
  message: { flexDirection: 'row', gap: 10 },
  corps: { flex: 1, gap: 2 },
  entete: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre },
  gras: { fontFamily: polices.texteGras, color: couleurs.encre },
  date: { color: couleurs.encre2 },
  contenu: { fontFamily: polices.texte, fontSize: 15, lineHeight: 21, color: couleurs.encre },
  actions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  action: { fontFamily: polices.texteGras, fontSize: 13, color: couleurs.encre2 },
  actionDanger: { color: couleurs.erreur },
});
