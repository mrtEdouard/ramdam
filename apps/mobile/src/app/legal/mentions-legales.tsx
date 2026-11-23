import { PageLegale } from '@/components/page-legale';
import { mentionsLegales } from '@/constants/textes-legaux';

// Page publique : accessible connecté ou non (voir app/_layout.tsx).
export default function MentionsLegales() {
  return <PageLegale page={mentionsLegales} />;
}
