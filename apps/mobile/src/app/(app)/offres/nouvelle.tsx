import type { OffreDetail, OffreDto } from '@ramdam/shared';
import { router } from 'expo-router';
import { FormulaireOffre } from '@/components/formulaire-offre';
import { appeler } from '@/lib/api';
import { useSession } from '@/session/session-context';

// Publication d'une offre : écran réservé aux Directeurs (Stack.Protected dans le layout).
export default function NouvelleOffre() {
  const { session } = useSession();

  async function publier(dto: OffreDto) {
    const offre = await appeler<OffreDetail>('POST', '/offres', session!.jeton, dto);
    return offre.id;
  }

  return (
    <FormulaireOffre
      enregistrer={publier}
      // replace : le bouton retour ne ramène pas au formulaire déjà envoyé.
      termine={(id) => router.replace({ pathname: '/offres/[id]', params: { id } })}
    />
  );
}
