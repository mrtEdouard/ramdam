import { BriefcaseBusiness } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';

export default function DetailOffre() {
  return (
    <PageAVenir
      icone={BriefcaseBusiness}
      titre="Offre de recrutement"
      description="La description du poste, les dates, le diplôme demandé et le contact pour candidater arrivent ici."
    />
  );
}
