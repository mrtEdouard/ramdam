import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

// Installer Ramdam sur l'écran d'accueil (PWA), depuis le site.
//
// Chrome, Edge et Samsung Internet envoient l'événement « beforeinstallprompt » quand le site
// est installable (manifeste + HTTPS). On le garde de côté : appeler sa méthode prompt() plus tard
// ouvre la vraie fenêtre d'installation du navigateur, au moment où l'utilisateur touche le bouton.
// Safari (iPhone) n'a pas cet événement : on ne peut qu'expliquer la manipulation.

type EvenementInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const surLeWeb = Platform.OS === 'web' && typeof window !== 'undefined';

let evenement: EvenementInstallation | null = null;
// L'état lu par les composants. Il est remplacé (jamais modifié) à chaque changement :
// useSyncExternalStore compare les objets pour savoir s'il faut redessiner.
let etat = { installee: surLeWeb && estOuverteCommeApp(), enUnAppui: false };
const abonnes = new Set<() => void>();
function changer(nouveau: Partial<typeof etat>) {
  etat = { ...etat, ...nouveau };
  abonnes.forEach((abonne) => abonne());
}

// L'événement arrive souvent dès le chargement de la page, avant l'affichage de l'accueil :
// on l'écoute ici, au chargement du module, et pas dans un composant.
if (surLeWeb) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // pas de bandeau automatique du navigateur : c'est nous qui proposons
    evenement = e as EvenementInstallation;
    changer({ enUnAppui: true });
  });
  window.addEventListener('appinstalled', () => {
    evenement = null;
    changer({ installee: true, enUnAppui: false });
  });
}

// Déjà lancée depuis l'icône de l'écran d'accueil : plein écran, sans barre d'adresse.
function estOuverteCommeApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function estIphone() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // Les iPad récents se présentent comme un Mac, mais ont un écran tactile.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export type Installation = {
  // Faut-il proposer l'installation ? (site web, pas encore installé)
  proposable: boolean;
  // Le navigateur sait installer en un appui (Chrome, Samsung Internet…).
  enUnAppui: boolean;
  iphone: boolean;
  telephone: boolean;
  installer: () => Promise<boolean>;
};

const lire = () => etat;
const sAbonner = (abonne: () => void) => {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
};

export function useInstallation(): Installation {
  // Le composant se redessine quand l'événement arrive ou quand l'app vient d'être installée.
  // On ne lit que l'état renvoyé par le hook, jamais les variables du module directement :
  // le React Compiler mémorise les calculs et ne verrait pas qu'elles ont changé.
  const { installee, enUnAppui } = useSyncExternalStore(sAbonner, lire, lire);

  if (!surLeWeb) {
    return { proposable: false, enUnAppui: false, iphone: false, telephone: true, installer };
  }
  return {
    proposable: !installee,
    enUnAppui,
    iphone: estIphone(),
    telephone: window.matchMedia('(pointer: coarse)').matches,
    installer,
  };
}

// Ouvre la fenêtre d'installation du navigateur. Renvoie vrai si l'utilisateur a accepté.
async function installer() {
  if (!evenement) {
    return false;
  }
  await evenement.prompt();
  const { outcome } = await evenement.userChoice;
  // Un événement ne sert qu'une fois : le navigateur en renverra un si on peut réessayer.
  evenement = null;
  changer({ enUnAppui: false, installee: outcome === 'accepted' });
  return outcome === 'accepted';
}

// « Plus tard » : on ne repropose pas avant une semaine. localStorage peut être indisponible
// (navigation privée) : on ne fait alors simplement rien.
const CLE = 'ramdam.installation.plus-tard';
const UNE_SEMAINE = 7 * 24 * 60 * 60 * 1000;

export function reporteeRecemment() {
  try {
    const le = Number(localStorage.getItem(CLE));
    return le > 0 && Date.now() - le < UNE_SEMAINE;
  } catch {
    return false;
  }
}

export function reporter() {
  try {
    localStorage.setItem(CLE, String(Date.now()));
  } catch {
    // tant pis : la fenêtre reviendra à la prochaine ouverture
  }
}
