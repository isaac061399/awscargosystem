// Components Imports
import Offices from '@/views-cus/offices/Offices';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const OfficesPage = withAuthPage(['roles.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Offices />
    </TranslationsProvider>
  );
});

export default OfficesPage;
