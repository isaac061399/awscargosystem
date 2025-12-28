// Components Imports
import UnownedPackages from '@/views-cus/unowned-packages/UnownedPackages';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const UnownedPackagesPage = withAuthPage(
  ['unowned-packages.list'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <UnownedPackages />
      </TranslationsProvider>
    );
  }
);

export default UnownedPackagesPage;
