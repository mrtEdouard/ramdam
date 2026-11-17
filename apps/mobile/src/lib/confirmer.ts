import { Alert, Platform } from 'react-native';

// Demande une confirmation avant une action irréversible (suppression).
// Sur le web, Alert ne propose pas de boutons : on utilise la boîte de dialogue du navigateur.
export function confirmer(titre: string, message: string, action: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titre}\n\n${message}`));
  }
  return new Promise((resoudre) => {
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resoudre(false) },
      { text: action, style: 'destructive', onPress: () => resoudre(true) },
    ]);
  });
}
