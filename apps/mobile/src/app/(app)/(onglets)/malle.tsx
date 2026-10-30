import { Backpack } from 'lucide-react-native';
import { PageAVenir } from '@/components/page-a-venir';

export default function Malle() {
  return (
    <PageAVenir
      icone={Backpack}
      titre="Ma Malle"
      description="Tes fiches et les fiches des autres que tu as mises de côté."
    />
  );
}
