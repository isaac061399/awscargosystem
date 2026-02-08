// Components Imports
import SpecialPackagesReceive from '@/views-cus/special-packages/SpecialPackagesReceive';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const SpecialPackagesReceivePage = withAuthPage(
  ['special-packages.receive'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <SpecialPackagesReceive />
      </TranslationsProvider>
    );
  }
);

export default SpecialPackagesReceivePage;
