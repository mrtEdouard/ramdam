import { useLocalSearchParams } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';
import { libellesTypeFiche, type TypeFiche } from '@/donnees/demo';

export default function Activites() {
  // Le type choisi sur l'accueil arrive dans l'adresse : /activites?type=VEILLEE
  const { type } = useLocalSearchParams<{ type?: TypeFiche }>();
  const filtre = type && libellesTypeFiche[type];

  return (
    <PageAVenir
      icone={Compass}
      titre={filtre ? `Activités : ${filtre}` : 'Activités'}
      description="Toutes les fiches publiées, avec recherche et filtres par type et par âge."
    />
  );
}
