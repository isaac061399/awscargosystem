// Components Imports
import Reports from '@/views-cus/reports/Reports';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ReportsPage = withAuthPage(['reports.view'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Reports />
    </TranslationsProvider>
  );
});

export default ReportsPage;
