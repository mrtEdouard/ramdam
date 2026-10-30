import { PencilLine } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';

export default function NouvelleFiche() {
  return (
    <PageAVenir
      icone={PencilLine}
      titre="Nouvelle fiche"
      description="Le formulaire pour décrire une activité : type, âges, durée, matériel et déroulement."
    />
  );
}
