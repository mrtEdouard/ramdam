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
