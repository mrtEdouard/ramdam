import { PageLegale } from '@/components/page-legale';
import { conditionsUtilisation } from '@/constants/textes-legaux';

// Page publique : accessible connecté ou non (voir app/_layout.tsx).
export default function ConditionsUtilisation() {
  return <PageLegale page={conditionsUtilisation} />;
}
