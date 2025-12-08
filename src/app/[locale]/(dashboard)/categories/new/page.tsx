// Controller Imports
import { getCategory } from '@controllers/Category.Controller';

// Components Imports
import CategoriesEdition from '@views/categories/CategoriesEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const CategoriesNewPage = withAuthPage(
  ['categories.create'],
  async ({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ref: string }> }) => {
    const { ref } = await searchParams;
    const props: { category?: any; isDuplicated?: boolean } = {};

    if (ref) {
      const category = await getCategory(Number(ref));

      if (category) {
        props.category = category;
        props.isDuplicated = true;
      }
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <CategoriesEdition {...props} />
      </TranslationsProvider>
    );
  }
);

export default CategoriesNewPage;
