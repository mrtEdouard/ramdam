import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { couleurs, polices } from '@/constants/theme';

type Props = {
  libelle: string;
  valeurs: string[];
  suggestions: string[];
  onChange: (valeurs: string[]) => void;
  maximum: number;
  placeholder: string;
  erreur?: string;
};

// Saisie par bulles : on touche une suggestion pour l'ajouter, on peut taper la sienne,
// et on retire une bulle choisie avec sa croix.
export function ChampBulles({
  libelle,
  valeurs,
  suggestions,
  onChange,
  maximum,
  placeholder,
  erreur,
}: Props) {
  const [saisie, setSaisie] = useState('');
  const [toutVoir, setToutVoir] = useState(false);

  const dejaChoisi = (mot: string) => valeurs.some((v) => v.toLowerCase() === mot.toLowerCase());
  const restantes = suggestions.filter((mot) => !dejaChoisi(mot));
  // Les suggestions sont nombreuses : on en montre 12, le reste sur demande.
  const affichees = toutVoir ? restantes : restantes.slice(0, 12);
  const plein = valeurs.length >= maximum;

  function ajouter(mot: string) {
    const propre = mot.trim();
    if (propre && !dejaChoisi(propre) && !plein) {
      onChange([...valeurs, propre]);
    }
  }

  function ajouterSaisie() {
    ajouter(saisie);
    setSaisie('');
  }

  return (
    <View style={styles.champ}>
      <Text style={styles.libelle}>
        {libelle}{' '}
        <Text style={styles.compte}>
          ({valeurs.length}/{maximum})
        </Text>
      </Text>

      {valeurs.length > 0 && (
        <View style={styles.bulles}>
          {valeurs.map((mot) => (
            <Pressable
              key={mot}
              onPress={() => onChange(valeurs.filter((v) => v !== mot))}
              style={styles.choisie}
              accessibilityRole="button"
              accessibilityLabel={`Retirer ${mot}`}
            >
              <Text style={styles.texteChoisi}>{mot}</Text>
              <X size={14} color={couleurs.surface} strokeWidth={2.5} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={[styles.ligneSaisie, erreur && { borderColor: couleurs.erreur }]}>
        <TextInput
          value={saisie}
          onChangeText={setSaisie}
          onSubmitEditing={ajouterSaisie}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder={plein ? `${maximum} au maximum` : placeholder}
          placeholderTextColor={couleurs.encre3}
          editable={!plein}
          maxLength={40}
          style={styles.saisie}
          accessibilityLabel={`Ajouter à ${libelle}`}
        />
        <Pressable
          onPress={ajouterSaisie}
          disabled={!saisie.trim() || plein}
          style={[styles.boutonAjouter, (!saisie.trim() || plein) && styles.inactif]}
          accessibilityRole="button"
          accessibilityLabel="Ajouter"
        >
          <Plus size={18} color={couleurs.surface} strokeWidth={2.5} />
        </Pressable>
      </View>
      {erreur && <Text style={styles.erreur}>{erreur}</Text>}

      {!plein && affichees.length > 0 && (
        <View style={styles.bulles}>
          {affichees.map((mot) => (
            <Pressable
              key={mot}
              onPress={() => ajouter(mot)}
              style={styles.suggestion}
              accessibilityRole="button"
              accessibilityLabel={`Ajouter ${mot}`}
            >
              <Plus size={13} color={couleurs.corail} strokeWidth={2.5} />
              <Text style={styles.texteSuggestion}>{mot}</Text>
            </Pressable>
          ))}
          {restantes.length > 12 && (
            <Pressable
              onPress={() => setToutVoir(!toutVoir)}
              style={styles.plus}
              accessibilityRole="button"
            >
              <Text style={styles.textePlus}>
                {toutVoir ? 'Moins de suggestions' : `+ ${restantes.length - 12} idées`}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  champ: { gap: 10 },
  libelle: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  compte: { fontFamily: polices.texte, color: couleurs.encre2 },
  bulles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choisie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: couleurs.encre,
  },
  texteChoisi: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.surface },
  ligneSaisie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingLeft: 16,
    paddingRight: 6,
    borderWidth: 1.5,
    borderColor: couleurs.trait,
    borderRadius: 14,
    backgroundColor: couleurs.fond,
  },
  saisie: {
    flex: 1,
    minWidth: 0,
    fontFamily: polices.texte,
    fontSize: 16,
    color: couleurs.encre,
    outlineWidth: 0,
  },
  boutonAjouter: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.encre,
  },
  inactif: { opacity: 0.3 },
  erreur: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.erreur },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: couleurs.trait,
    backgroundColor: couleurs.surface,
  },
  texteSuggestion: { fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.encre },
  plus: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 8 },
  textePlus: { fontFamily: polices.texteGras, fontSize: 14, color: couleurs.corail },
});
