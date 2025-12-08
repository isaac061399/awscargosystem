// Components Imports
import OfficesEdition from '@/views-cus/offices/OfficesEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const OfficesNewPage = withAuthPage(['roles.create'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <OfficesEdition />
    </TranslationsProvider>
  );
});

export default OfficesNewPage;
