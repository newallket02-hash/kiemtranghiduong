import Portal from './portal';
import { SHEET_URL } from '@/lib/backend';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <Portal sheetUrl={SHEET_URL} />;
}
