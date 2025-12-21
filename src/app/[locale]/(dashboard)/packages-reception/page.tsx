// Controller Imports
import { getAllOffices } from '@/controllers/Office.Controller';

// Components Imports
import PackagesReception from '@/views-cus/packages/PackagesReception';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PackagesReceptionPage = withAuthPage(
  ['packages.reception'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    const offices = await getAllOffices();

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <PackagesReception offices={offices} />
      </TranslationsProvider>
    );
  }
);

export default PackagesReceptionPage;
