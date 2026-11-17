import type { ConnexionDto, InscriptionDto, Session } from '@ramdam/shared';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { envoyer, surSessionRefusee } from '@/lib/api';
import { effacerSession, enregistrerSession, lireSession } from './stockage-session';

type ContexteSession = {
  session: Session | null;
  // Vrai tant qu'on lit la session enregistrée au lancement de l'app.
  chargement: boolean;
  inscrire: (dto: InscriptionDto) => Promise<void>;
  connecter: (dto: ConnexionDto) => Promise<void>;
  deconnecter: () => Promise<void>;
  // Pourquoi on a été déconnecté de force (compte supprimé, session expirée), affiché
  // sur l'écran de connexion ; null après une déconnexion normale.
  avertissement: string | null;
};

const SessionContext = createContext<ContexteSession | null>(null);

// Garde la session de l'utilisateur et la rend accessible à tous les écrans.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);
  const [avertissement, setAvertissement] = useState<string | null>(null);

  useEffect(() => {
    lireSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setChargement(false));
  }, []);

  // L'API a refusé la session : on l'oublie, et la navigation renvoie à la connexion.
  useEffect(() => {
    surSessionRefusee((message) => {
      effacerSession().catch(() => {});
      setSession(null);
      setAvertissement(message);
    });
    return () => surSessionRefusee(null);
  }, []);

  async function ouvrir(nouvelle: Session) {
    await enregistrerSession(nouvelle);
    setAvertissement(null);
    setSession(nouvelle);
  }

  const valeur: ContexteSession = {
    session,
    chargement,
    avertissement,
    inscrire: async (dto) => ouvrir(await envoyer<Session>('/auth/inscription', dto)),
    connecter: async (dto) => ouvrir(await envoyer<Session>('/auth/connexion', dto)),
    deconnecter: async () => {
      await effacerSession();
      setAvertissement(null);
      setSession(null);
    },
  };

  return <SessionContext value={valeur}>{children}</SessionContext>;
}

export function useSession() {
  const contexte = use(SessionContext);
  if (!contexte) {
    throw new Error('useSession doit être utilisé dans un SessionProvider');
  }
  return contexte;
}
