// Next Imports
import { redirect } from 'next/navigation';

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

const ContentsEditPage = withAuthPage(
  ['contents.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const categories = await getAllCategories();
    const pages = await getAllPages();

    const { id } = await params;
    const content = await getContent(Number(id));

    if (!content) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <ContentsEdition categories={categories} pages={pages} content={content} />
      </TranslationsProvider>
    );
  }
);

export default ContentsEditPage;
