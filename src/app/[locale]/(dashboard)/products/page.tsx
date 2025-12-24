// Components Imports
import Products from '@/views-cus/products/Products';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ProductsPage = withAuthPage(['products.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Products />
    </TranslationsProvider>
  );
});

export default ProductsPage;
