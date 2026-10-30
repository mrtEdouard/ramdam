import type { Session } from '@ramdam/shared';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLE = 'ramdam.session';

// Sur téléphone, SecureStore chiffre la valeur avec le Trousseau (iOS) ou le Keystore (Android).
// Le navigateur n'a pas d'équivalent : on utilise localStorage, réservé au développement.
const surLeWeb = Platform.OS === 'web';

export async function lireSession(): Promise<Session | null> {
  const texte = surLeWeb ? localStorage.getItem(CLE) : await SecureStore.getItemAsync(CLE);
  if (!texte) {
    return null;
  }
  const session = JSON.parse(texte) as Session;
  return jetonExpire(session.jeton) ? null : session;
}

export async function enregistrerSession(session: Session) {
  const texte = JSON.stringify(session);
  if (surLeWeb) {
    localStorage.setItem(CLE, texte);
  } else {
    await SecureStore.setItemAsync(CLE, texte);
  }
}

export async function effacerSession() {
  if (surLeWeb) {
    localStorage.removeItem(CLE);
  } else {
    await SecureStore.deleteItemAsync(CLE);
  }
}

// Un JWT est fait de trois parties en base64url ; la deuxième contient exp,
// la date d'expiration en secondes. On la lit sans vérifier la signature : c'est le rôle de l'API.
function jetonExpire(jeton: string) {
  try {
    const base64 = jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64)) as { exp: number };
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
