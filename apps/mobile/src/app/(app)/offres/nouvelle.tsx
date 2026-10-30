import { Megaphone } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';

export default function NouvelleOffre() {
  return (
    <PageAVenir
      icone={Megaphone}
      titre="Nouvelle offre"
      description="Le formulaire de publication d'une offre, réservé aux comptes Directeur."
    />
  );
}
