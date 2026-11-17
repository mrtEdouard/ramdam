import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ErreurApi, lire } from '@/lib/api';
import { useSession } from '@/session/session-context';

type Etat<T> = { donnees: T | null; erreur: string | null; chargement: boolean };

// Charge une route protégée de l'API à chaque fois que l'écran s'affiche,
// et renvoie les données, l'erreur éventuelle et l'état de chargement.
export function useRequete<T>(chemin: string) {
  const { session, deconnecter } = useSession();
  const [etat, setEtat] = useState<Etat<T>>({ donnees: null, erreur: null, chargement: true });

  const charger = useCallback(async () => {
    if (!session) {
      return;
    }
    setEtat((precedent) => ({ ...precedent, chargement: true }));
    try {
      const donnees = await lire<T>(chemin, session.jeton);
      setEtat({ donnees, erreur: null, chargement: false });
    } catch (e) {
      // Jeton expiré ou refusé : retour à la connexion.
      if (e instanceof ErreurApi && e.statut === 401) {
        await deconnecter();
        return;
      }
      setEtat({
        donnees: null,
        erreur: e instanceof ErreurApi ? e.message : 'Une erreur est survenue.',
        chargement: false,
      });
    }
  }, [chemin, session, deconnecter]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { ...etat, recharger: charger };
}
