import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

export const URL_API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Erreur renvoyée par l'API, avec le message à afficher et les erreurs par champ s'il y en a.
export class ErreurApi extends Error {
  constructor(
    public readonly statut: number,
    message: string,
    public readonly champs: Record<string, string> = {},
  ) {
    super(message);
  }
}

type CorpsErreur = {
  message?: unknown;
  erreurs?: { champ: string; message: string }[];
};

// POST avec un corps JSON (inscription, connexion...).
export function envoyer<T>(chemin: string, corps: unknown): Promise<T> {
  return requete<T>(chemin, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
}

// GET d'une route protégée : le jeton prouve à l'API qui fait la demande (JwtAuthGuard).
export function lire<T>(chemin: string, jeton: string): Promise<T> {
  return appeler<T>('GET', chemin, jeton);
}

// Appel d'une route protégée avec n'importe quelle méthode (POST, PATCH, DELETE...).
export function appeler<T>(
  methode: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  chemin: string,
  jeton: string,
  corps?: unknown,
): Promise<T> {
  return requete<T>(chemin, {
    method: methode,
    headers: {
      Authorization: `Bearer ${jeton}`,
      ...(corps !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
  });
}

// Envoi d'une photo choisie dans la galerie du téléphone (multipart/form-data, champ « image »).
export async function envoyerPhoto<T>(
  methode: 'POST' | 'PUT',
  chemin: string,
  jeton: string,
  photo: ImagePickerAsset,
): Promise<T> {
  const formulaire = new FormData();
  const nom = photo.fileName ?? 'photo.jpg';
  if (Platform.OS === 'web') {
    // Sur le web, le sélecteur donne un vrai fichier du navigateur.
    formulaire.append('image', photo.file ?? (await (await fetch(photo.uri)).blob()), nom);
  } else {
    // Sur téléphone, React Native lit le fichier à partir de son adresse locale.
    formulaire.append('image', {
      uri: photo.uri,
      name: nom,
      type: photo.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
  }
  // Pas de Content-Type : fetch le calcule lui-même, avec la frontière entre les parties.
  return requete<T>(chemin, {
    method: methode,
    headers: { Authorization: `Bearer ${jeton}` },
    body: formulaire,
  });
}

async function requete<T>(chemin: string, options: RequestInit): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`${URL_API}${chemin}`, options);
  } catch {
    // fetch échoue seulement si le serveur est injoignable (pas de réseau, mauvaise adresse).
    throw new ErreurApi(0, 'Impossible de joindre le serveur. Vérifie ta connexion.');
  }

  // Une réponse sans contenu (204, ou « null » renvoyé par l'API) donne null, pas un objet vide :
  // sinon l'écran croirait avoir reçu une fiche, sans titre ni auteur.
  const texte = await reponse.text();
  let donnees: unknown = null;
  try {
    donnees = texte ? JSON.parse(texte) : null;
  } catch {
    // Réponse qui n'est pas du JSON (page d'erreur d'un proxy, par exemple) : traitée comme vide.
  }
  if (reponse.ok) {
    return donnees as T;
  }

  if (reponse.status === 429) {
    throw new ErreurApi(429, 'Trop de tentatives. Réessaie dans une minute.');
  }
  const { message, erreurs = [] } = (donnees ?? {}) as CorpsErreur;
  const champs: Record<string, string> = {};
  for (const erreur of erreurs) {
    champs[erreur.champ] ??= erreur.message;
  }
  throw new ErreurApi(
    reponse.status,
    typeof message === 'string' ? message : 'Une erreur est survenue. Réessaie.',
    champs,
  );
}
