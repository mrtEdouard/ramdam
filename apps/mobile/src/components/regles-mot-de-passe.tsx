import { reglesMotDePasse } from '@ramdam/shared';
import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

type Props = {
  motDePasse: string;
  erreur?: string;
};

// Liste des règles sous le champ : chaque règle passe au vert dès qu'elle est respectée,
// et celles qui manquent passent en rouge quand le champ est en erreur.
export function ReglesMotDePasse({ motDePasse, erreur }: Props) {
  const toutesRespectees = reglesMotDePasse.every((regle) => regle.regex.test(motDePasse));

  return (
    <View style={styles.bloc} accessibilityLiveRegion={erreur ? 'polite' : 'none'}>
      <View style={styles.liste}>
        {reglesMotDePasse.map((regle) => {
          const respectee = regle.regex.test(motDePasse);
          const manquante = erreur !== undefined && !respectee;
          return (
            <View key={regle.libelle} style={styles.regle}>
              <View
                style={[
                  styles.pastille,
                  respectee && styles.pastilleOk,
                  manquante && { borderColor: couleurs.erreur },
                ]}
              >
                {respectee && <Check size={10} color={couleurs.surface} strokeWidth={3.5} />}
              </View>
              <Text
                style={[styles.texte, respectee && styles.texteOk, manquante && styles.texteErreur]}
                accessibilityLabel={`${regle.libelle}, ${respectee ? 'respecté' : 'non respecté'}`}
              >
                {regle.libelle}
              </Text>
            </View>
          );
        })}
      </View>
      {/* Erreur qui ne vient pas d'une règle de la liste, par exemple un mot de passe trop long. */}
      {erreur && toutesRespectees && <Text style={styles.texteErreur}>{erreur}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: 6 },
  liste: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  regle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pastille: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: couleurs.encre3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastilleOk: { backgroundColor: couleurs.succes, borderColor: couleurs.succes },
  texte: { fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
  texteOk: { color: couleurs.succes },
  texteErreur: { fontFamily: polices.texteMoyen, fontSize: 13, color: couleurs.erreur },
});
