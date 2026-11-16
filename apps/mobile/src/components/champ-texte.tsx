import type { LucideIcon } from 'lucide-react-native';
import { CircleAlert, Eye, EyeOff } from 'lucide-react-native';
import { useState, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';
import { couleurs, polices } from '@/constants/theme';

type Props = TextInputProps & {
  libelle: string;
  icone?: LucideIcon;
  erreur?: string;
  // Contenu affiché sous le champ à la place du message d'erreur : il gère lui-même l'erreur.
  aide?: ReactNode;
  motDePasse?: boolean;
  ref?: Ref<TextInputInstance>;
};

export function ChampTexte({
  libelle,
  icone: Icone,
  erreur,
  aide,
  motDePasse = false,
  ref,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);

  const couleurBord = erreur ? couleurs.erreur : focus ? couleurs.encre : couleurs.trait;

  return (
    <View style={styles.champ}>
      <Text style={styles.libelle}>{libelle}</Text>
      <View
        style={[
          styles.boite,
          props.multiline && styles.boiteMultiligne,
          { borderColor: couleurBord },
        ]}
      >
        {/* flexShrink: 0 : dans un champ étroit, c'est la saisie qui rétrécit, jamais l'icône. */}
        {Icone && (
          <View style={styles.icone}>
            <Icone size={20} color={couleurs.encre3} strokeWidth={1.75} />
          </View>
        )}
        <TextInput
          ref={ref}
          style={[styles.saisie, props.multiline && styles.saisieMultiligne]}
          placeholderTextColor={couleurs.encre3}
          accessibilityLabel={libelle}
          secureTextEntry={motDePasse && !visible}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {motDePasse && (
          <Pressable
            onPress={() => setVisible(!visible)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {visible ? (
              <EyeOff size={20} color={couleurs.encre2} strokeWidth={1.75} />
            ) : (
              <Eye size={20} color={couleurs.encre2} strokeWidth={1.75} />
            )}
          </Pressable>
        )}
      </View>
      {aide ??
        (erreur && (
          // accessibilityLiveRegion : le lecteur d'écran annonce l'erreur dès qu'elle apparaît (Android).
          <View style={styles.ligneErreur} accessibilityLiveRegion="polite">
            <CircleAlert size={15} color={couleurs.erreur} strokeWidth={2} />
            <Text style={styles.erreur}>{erreur}</Text>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  champ: { gap: 8 },
  libelle: { fontFamily: polices.texteGras, fontSize: 15, color: couleurs.encre },
  boite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: couleurs.fond,
  },
  icone: { flexShrink: 0 },
  saisie: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    fontFamily: polices.texte,
    fontSize: 16,
    color: couleurs.encre,
    // Sur le web, la bordure change déjà de couleur au focus : on retire le contour du navigateur.
    outlineWidth: 0,
  },
  // Champ de plusieurs lignes (déroulement d'une fiche) : le texte part du haut.
  boiteMultiligne: { minHeight: 120, alignItems: 'flex-start', paddingVertical: 12 },
  saisieMultiligne: { minHeight: 96, textAlignVertical: 'top' },
  ligneErreur: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  erreur: { flex: 1, fontFamily: polices.texteMoyen, fontSize: 14, color: couleurs.erreur },
});
