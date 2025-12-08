// Controller Imports
import { getAllCategories } from '@controllers/Category.Controller';
import { getContent } from '@controllers/Content.Controller';
import { getAllPages } from '@controllers/Page.Controller';

// Components Imports
import ContentsEdition from '@views/contents/ContentsEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ContentsNewPage = withAuthPage(
  ['contents.create'],
  async ({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ref: string }> }) => {
    const categories = await getAllCategories();
    const pages = await getAllPages();

    const { ref } = await searchParams;
    const props: { categories: any; pages: any; content?: any; isDuplicated?: boolean } = { categories, pages };

    if (ref) {
      const content = await getContent(Number(ref));

      if (content) {
        props.content = content;
        props.isDuplicated = true;
      }
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <ContentsEdition {...props} />
      </TranslationsProvider>
    );
  }
);

export default ContentsNewPage;
