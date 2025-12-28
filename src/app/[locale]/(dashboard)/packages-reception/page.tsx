// Components Imports
import PackagesReception from '@/views-cus/packages/PackagesReception';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PackagesReceptionPage = withAuthPage(
  ['packages.reception'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <PackagesReception />
      </TranslationsProvider>
    );
  }
);

export default PackagesReceptionPage;
