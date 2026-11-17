import type { CreerFicheDto, FicheDetail } from '@ramdam/shared';
import { router } from 'expo-router';
import { FormulaireFiche } from '@/components/formulaire-fiche';
import { appeler } from '@/lib/api';
import { useSession } from '@/session/session-context';

export default function NouvelleFiche() {
  const { session } = useSession();

  async function creer(dto: CreerFicheDto) {
    const fiche = await appeler<FicheDetail>('POST', '/fiches', session!.jeton, dto);
    return fiche.id;
  }

  return (
    <FormulaireFiche
      enregistrer={creer}
      // replace : le bouton retour ne ramène pas au formulaire déjà envoyé.
      termine={(id) => router.replace({ pathname: '/fiches/[id]', params: { id } })}
    />
  );
}
