// Components Imports
import Categories from '@views/categories/Categories';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const CategoriesPage = withAuthPage(
  ['categories.list'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <Categories />
      </TranslationsProvider>
    );
  }
);

export default CategoriesPage;
