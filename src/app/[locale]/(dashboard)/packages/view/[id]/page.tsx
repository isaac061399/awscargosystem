// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getPackage } from '@controllers/Package.Controller';

// Components Imports
import PackagesView from '@/views-cus/packages/PackagesView';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PackagesViewPage = withAuthPage(
  ['packages.view'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const packageObj = await getPackage(Number(id));

    if (!packageObj) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <PackagesView packageObj={packageObj} />
      </TranslationsProvider>
    );
  }
);

export default PackagesViewPage;
