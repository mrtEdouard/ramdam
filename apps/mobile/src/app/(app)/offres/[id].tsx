import { useLocalSearchParams } from 'expo-router';
import { BriefcaseBusiness } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';
import { offresRecentes } from '@/donnees/demo';

export default function DetailOffre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const offre = offresRecentes.find((o) => o.id === id);

  return (
    <PageAVenir
      icone={BriefcaseBusiness}
      titre={offre?.intitule ?? 'Offre introuvable'}
      description="La description du poste, les dates, le diplôme demandé et le contact pour candidater arrivent ici."
    />
  );
}
