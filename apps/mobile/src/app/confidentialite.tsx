import { PageLegale } from '@/components/page-legale';
import { politiqueConfidentialite } from '@/constants/textes-legaux';

// Page publique : accessible connecté ou non (voir app/_layout.tsx).
export default function Confidentialite() {
  return <PageLegale page={politiqueConfidentialite} />;
}
