import { useLocalSearchParams } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';
import { fichesRecentes } from '@/donnees/demo';

export default function DetailFiche() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fiche = fichesRecentes.find((f) => f.id === id);

  return (
    <PageAVenir
      icone={FileText}
      titre={fiche?.titre ?? 'Fiche introuvable'}
      description="Le déroulement, le matériel, les commentaires et le bouton « Ajouter à ma Malle » arrivent ici."
    />
  );
}
