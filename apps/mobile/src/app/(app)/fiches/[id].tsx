import { FileText } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';

export default function DetailFiche() {
  return (
    <PageAVenir
      icone={FileText}
      titre="Fiche d'activité"
      description="Le déroulement, le matériel, les commentaires et le bouton « Ajouter à ma Malle » arrivent ici."
    />
  );
}
