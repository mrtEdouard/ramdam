import type { Region } from '@ramdam/shared';
import { MapPin } from 'lucide-react-native';
import { useEffect, useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { ChampTexte } from '@/components/champ-texte';
import { couleurs, polices } from '@/constants/theme';
import { chercherCommunes, type Commune } from '@/lib/communes';

type Props = {
  valeur: string;
  changer: (ville: string) => void;
  region: Region | undefined;
  erreur?: string;
  onBlur?: () => void;
  ref?: Ref<TextInputInstance>;
};

// Champ « Ville » qui propose les communes de la région choisie pendant la saisie.
export function ChampVille({ valeur, changer, region, erreur, onBlur, ref }: Props) {
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  // Après un choix dans la liste (ou en modifiant une offre qui a déjà sa ville),
  // on ne relance pas la recherche sur ce nom.
  const [choisie, setChoisie] = useState(valeur.trim() !== '');
  // Vrai pendant que l'API répond : on l'indique, car elle peut mettre quelques secondes.
  const [recherche, setRecherche] = useState(false);

  useEffect(() => {
    const texte = valeur.trim();
    if (choisie || texte.length < 2) {
      setSuggestions([]);
      setRecherche(false);
      return;
    }
    // On attend 250 ms sans nouvelle frappe avant de chercher, et on annule la recherche
    // précédente si l'on tape encore : pas une requête par lettre, ni de réponse dans le désordre.
    const controleur = new AbortController();
    const minuterie = setTimeout(() => {
      setRecherche(true);
      chercherCommunes(texte, region, controleur.signal)
        .then(setSuggestions)
        .catch(() => setSuggestions([])) // hors ligne : on écrit simplement la ville
        .finally(() => {
          if (!controleur.signal.aborted) {
            setRecherche(false);
          }
        });
    }, 250);
    return () => {
      clearTimeout(minuterie);
      controleur.abort();
    };
  }, [valeur, region, choisie]);

  function choisir(commune: Commune) {
    setChoisie(true);
    setSuggestions([]);
    changer(commune.nom);
  }

  return (
    <View>
      <ChampTexte
        ref={ref}
        libelle="Ville"
        placeholder={region ? `Une ville en ${region}` : 'Annecy'}
        maxLength={80}
        autoComplete="off"
        value={valeur}
        onChangeText={(texte) => {
          setChoisie(false);
          changer(texte);
        }}
        onBlur={onBlur}
        erreur={erreur}
      />
      {recherche && suggestions.length === 0 && (
        <Text style={styles.recherche} accessibilityLiveRegion="polite">
          Recherche des villes…
        </Text>
      )}
      {suggestions.length > 0 && (
        <View style={styles.liste} accessibilityRole="list">
          {suggestions.map((commune, position) => (
            <Pressable
              key={`${commune.nom}-${commune.codePostal}`}
              onPress={() => choisir(commune)}
              style={({ pressed }) => [
                styles.suggestion,
                position > 0 && styles.separation,
                pressed && styles.appuyee,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${commune.nom}, ${commune.codePostal}`}
            >
              <MapPin size={16} color={couleurs.corail} />
              <Text style={styles.nom}>{commune.nom}</Text>
              <Text style={styles.codePostal}>{commune.codePostal}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  recherche: { marginTop: 6, fontFamily: polices.texte, fontSize: 13, color: couleurs.encre2 },
  liste: {
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: couleurs.encre,
    backgroundColor: couleurs.surface,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  separation: { borderTopWidth: 1, borderTopColor: couleurs.trait },
  appuyee: { backgroundColor: couleurs.corailDoux },
  nom: { flex: 1, fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  codePostal: { fontFamily: polices.texte, fontSize: 14, color: couleurs.encre2 },
});
