// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getPage } from '@controllers/Page.Controller';

// Components Imports
import PagesEdition from '@views/pages/PagesEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PagesEditPage = withAuthPage(
  ['pages.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const page = await getPage(Number(id));

    if (!page) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <PagesEdition page={page} />
      </TranslationsProvider>
    );
  }
);

export default PagesEditPage;
