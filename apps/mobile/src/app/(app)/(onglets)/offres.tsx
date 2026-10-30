import { BriefcaseBusiness } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';

export default function Offres() {
  return (
    <PageAVenir
      icone={BriefcaseBusiness}
      titre="Offres"
      description="Les offres de recrutement publiées par les Directeurs, filtrées par région et par période."
    />
  );
}
