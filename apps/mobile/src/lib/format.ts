// « il y a 3 j », « il y a 2 h » : la date relative affichée sur les cartes.
export function depuis(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 60) {
    return `il y a ${Math.max(minutes, 1)} min`;
  }
  const heures = Math.round(minutes / 60);
  if (heures < 24) {
    return `il y a ${heures} h`;
  }
  return `il y a ${Math.round(heures / 24)} j`;
}

// 90 → « 1 h 30 », 45 → « 45 min ».
export function duree(minutes: number) {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures === 0) {
    return `${reste} min`;
  }
  return reste === 0 ? `${heures} h` : `${heures} h ${reste}`;
}

const moisCourts = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

// Date de début d'une offre sur une pastille : { jour: '05', mois: 'juil.' }.
export function jourEtMois(date: Date) {
  return { jour: String(date.getDate()).padStart(2, '0'), mois: moisCourts[date.getMonth()] };
}

// « du 5 juil. au 26 juil. »
export function periode(debut: Date, fin: Date) {
  const { mois: moisDebut } = jourEtMois(debut);
  const { mois: moisFin } = jourEtMois(fin);
  return `du ${debut.getDate()} ${moisDebut} au ${fin.getDate()} ${moisFin}`;
}

// « oct. 2026 »
export function moisEtAnnee(date: Date) {
  return `${moisCourts[date.getMonth()]} ${date.getFullYear()}`;
}

// Compteur façon réseau social : 950 → « 950 », 1 240 → « 1,2 k », 18 600 → « 18,6 k ».
export function compteur(nombre: number) {
  if (nombre < 1000) {
    return String(nombre);
  }
  return `${(nombre / 1000).toFixed(1).replace('.', ',').replace(',0', '')} k`;
}

const JOUR = 24 * 60 * 60 * 1000;
// Nombre de jours entre deux dates sans heure (AAAA-MM-JJ), en ignorant les fuseaux.
const joursEntre = (debut: string, fin: string) =>
  Math.round((Date.parse(fin) - Date.parse(debut)) / JOUR);
const aujourdhui = () => new Date().toISOString().slice(0, 10);

// Durée d'une offre : « 5 jours », « 3 semaines » ; rien pour un poste à l'année (plus de 2 mois).
export function dureeOffre(dateDebut: string, dateFin: string) {
  const jours = joursEntre(dateDebut, dateFin) + 1;
  if (jours > 62) {
    return null;
  }
  if (jours < 10) {
    return `${jours} jour${jours > 1 ? 's' : ''}`;
  }
  const semaines = Math.round(jours / 7);
  return `${semaines} semaine${semaines > 1 ? 's' : ''}`;
}

// « Commence demain », « Commence dans 12 j », « En cours » ; rien si le départ est loin (> 30 j).
export function departProche(dateDebut: string) {
  const jours = joursEntre(aujourdhui(), dateDebut);
  if (jours <= 0) {
    return 'En cours';
  }
  if (jours === 1) {
    return 'Commence demain';
  }
  return jours <= 30 ? `Commence dans ${jours} j` : null;
}
