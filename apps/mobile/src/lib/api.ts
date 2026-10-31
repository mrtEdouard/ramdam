const URL_API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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
  return requete<T>(chemin, { headers: { Authorization: `Bearer ${jeton}` } });
}

async function requete<T>(chemin: string, options: RequestInit): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`${URL_API}${chemin}`, options);
  } catch {
    // fetch échoue seulement si le serveur est injoignable (pas de réseau, mauvaise adresse).
    throw new ErreurApi(0, 'Impossible de joindre le serveur. Vérifie ta connexion.');
  }

  const donnees = await reponse.json().catch(() => ({}));
  if (reponse.ok) {
    return donnees as T;
  }

  if (reponse.status === 429) {
    throw new ErreurApi(429, 'Trop de tentatives. Réessaie dans une minute.');
  }
  const { message, erreurs = [] } = donnees as CorpsErreur;
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
