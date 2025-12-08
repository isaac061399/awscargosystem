// Controller Imports
import { getPage } from '@controllers/Page.Controller';

// Components Imports
import PagesEdition from '@views/pages/PagesEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PagesNewPage = withAuthPage(
  ['pages.create'],
  async ({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ref: string }> }) => {
    const { ref } = await searchParams;
    const props: { page?: any; isDuplicated?: boolean } = {};

    if (ref) {
      const page = await getPage(Number(ref));

      if (page) {
        props.page = page;
        props.isDuplicated = true;
      }
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <PagesEdition {...props} />
      </TranslationsProvider>
    );
  }
);

export default PagesNewPage;
