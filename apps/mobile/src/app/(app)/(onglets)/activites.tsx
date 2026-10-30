import { Compass } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';

export default function Activites() {
  return (
    <PageAVenir
      icone={Compass}
      titre="Activités"
      description="Toutes les fiches publiées, avec recherche et filtres par type et par âge."
    />
  );
}
