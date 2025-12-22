// Components Imports
import Packages from '@/views-cus/packages/Packages';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PackagesPage = withAuthPage(['packages.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Packages />
    </TranslationsProvider>
  );
});

export default PackagesPage;
