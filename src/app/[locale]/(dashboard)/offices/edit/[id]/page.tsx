// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getOffice } from '@controllers/Office.Controller';

// Components Imports
import OfficesEdition from '@/views-cus/offices/OfficesEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const OfficesNewPage = withAuthPage(
  ['offices.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const office = await getOffice(Number(id));

    if (!office) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <OfficesEdition office={office} />
      </TranslationsProvider>
    );
  }
);

export default OfficesNewPage;
