import {
  motifsSignalement,
  signalementSchema,
  type CibleSignalement,
  type MotifSignalement,
} from '@ramdam/shared';
import { Flag, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Bouton } from '@/components/bouton';
import { ChampTexte } from '@/components/champ-texte';
import { MessageErreur } from '@/components/message-erreur';
import { useToast } from '@/components/toast';
import { couleurs, polices } from '@/constants/theme';
import { appeler, ErreurApi } from '@/lib/api';
import { useSession } from '@/session/session-context';

type Props = {
  cible: CibleSignalement;
  cibleId: string;
  // Style du libellé, pour se fondre dans les actions d'un commentaire (« Répondre · Signaler »).
  styleTexte?: TextStyle;
  avecIcone?: boolean;
};

// « Signaler » : ouvre une fenêtre où l'on choisit un motif, puis envoie le signalement (RG-20).
export function BoutonSignaler({ cible, cibleId, styleTexte, avecIcone = true }: Props) {
  const { session } = useSession();
  const afficherToast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState<MotifSignalement | null>(null);
  const [precision, setPrecision] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // « Offre douteuse » n'a de sens que pour une offre.
  const motifs = (Object.keys(motifsSignalement) as MotifSignalement[]).filter(
    (m) => m !== 'FAUSSE_OFFRE' || cible === 'OFFRE',
  );

  function fermer() {
    setOuvert(false);
    setMotif(null);
    setPrecision('');
    setErreur(null);
  }

  async function envoyer() {
    if (!session) {
      return;
    }
    // Même schéma Zod que l'API.
    const resultat = signalementSchema.safeParse({
      cible,
      cibleId,
      motif: motif ?? undefined,
      precision: precision.trim() || undefined,
    });
    if (!resultat.success) {
      setErreur(resultat.error.issues[0].message);
      return;
    }
    setEnvoi(true);
    try {
      const { message } = await appeler<{ message: string }>(
        'POST',
        '/signalements',
        session.jeton,
        resultat.data,
      );
      fermer();
      afficherToast(message);
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : 'Le signalement n’a pas pu être envoyé.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOuvert(true)}
        style={styles.declencheur}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Signaler ce contenu"
      >
        {avecIcone && <Flag size={14} color={couleurs.encre3} strokeWidth={2} />}
        <Text style={[styles.texteDeclencheur, styleTexte]}>Signaler</Text>
      </Pressable>

      <Modal visible={ouvert} transparent animationType="fade" onRequestClose={fermer}>
        <Pressable style={styles.voile} onPress={fermer} accessibilityLabel="Fermer">
          <Pressable style={styles.fenetre} onPress={() => {}}>
            <View style={styles.entete}>
              <Text style={styles.titre} accessibilityRole="header">
                Signaler
              </Text>
              <Pressable
                onPress={fermer}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <X size={22} color={couleurs.encre} />
              </Pressable>
            </View>
            <Text style={styles.question}>Qu’est-ce qui ne va pas ?</Text>

            <View accessibilityRole="radiogroup">
              {motifs.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMotif(m);
                    setErreur(null);
                  }}
                  style={styles.motif}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: motif === m }}
                >
                  <View style={[styles.rond, motif === m && styles.rondChoisi]}>
                    {motif === m && <View style={styles.point} />}
                  </View>
                  <Text style={styles.texteMotif}>{motifsSignalement[m]}</Text>
                </Pressable>
              ))}
            </View>

            <ChampTexte
              libelle={motif === 'AUTRE' ? 'Précise' : 'Précision (facultatif)'}
              placeholder="Ce qui pose problème…"
              multiline
              maxLength={300}
              value={precision}
              onChangeText={(texte) => {
                setPrecision(texte);
                setErreur(null);
              }}
            />
            {erreur && <MessageErreur message={erreur} />}
            <Bouton titre="Envoyer le signalement" onPress={envoyer} chargement={envoi} />
            <Text style={styles.note}>
              L’auteur ne saura pas qui l’a signalé. La modération décide de masquer ou non.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  declencheur: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  texteDeclencheur: { fontFamily: polices.texteMoyen, fontSize: 13, color: couleurs.encre3 },
  voile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(30, 26, 22, 0.45)',
  },
  fenetre: {
    width: '100%',
    maxWidth: 460,
    gap: 12,
    padding: 18,
    borderRadius: 10,
    backgroundColor: couleurs.fond,
  },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titre: { fontFamily: polices.titre, fontSize: 22, letterSpacing: -0.5, color: couleurs.encre },
  question: { fontFamily: polices.texteMoyen, fontSize: 15, color: couleurs.encre2 },
  motif: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  rond: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: couleurs.encre3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rondChoisi: { borderColor: couleurs.corail },
  point: { width: 10, height: 10, borderRadius: 5, backgroundColor: couleurs.corail },
  texteMotif: { flex: 1, fontFamily: polices.texte, fontSize: 15, color: couleurs.encre },
  note: { fontFamily: polices.texte, fontSize: 12, color: couleurs.encre2, textAlign: 'center' },
});
