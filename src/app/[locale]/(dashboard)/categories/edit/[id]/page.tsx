// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getCategory } from '@controllers/Category.Controller';

// Components Imports
import CategoriesEdition from '@views/categories/CategoriesEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const CategoryEditPage = withAuthPage(
  ['categories.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const category = await getCategory(Number(id));

    if (!category) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <CategoriesEdition category={category} />
      </TranslationsProvider>
    );
  }
);

export default CategoryEditPage;
