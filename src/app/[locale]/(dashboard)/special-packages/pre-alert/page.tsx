// Components Imports
import SpecialPackagesPreAlert from '@/views-cus/special-packages/SpecialPackagesPreAlert';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const SpecialPackagesPreAlertPage = withAuthPage(
  ['special-packages.pre-alert'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <SpecialPackagesPreAlert />
      </TranslationsProvider>
    );
  }
);

export default SpecialPackagesPreAlertPage;
