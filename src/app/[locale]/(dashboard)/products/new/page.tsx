// Components Imports
import ProductsEdition from '@/views-cus/products/ProductsEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ProductsNewPage = withAuthPage(
  ['products.create'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <ProductsEdition />
      </TranslationsProvider>
    );
  }
);

export default ProductsNewPage;
