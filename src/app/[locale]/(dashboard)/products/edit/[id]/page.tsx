// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getProduct } from '@controllers/Product.Controller';

// Components Imports
import ProductsEdition from '@/views-cus/products/ProductsEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ProductsEditPage = withAuthPage(
  ['products.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const product = await getProduct(Number(id));

    if (!product) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <ProductsEdition product={product} />
      </TranslationsProvider>
    );
  }
);

export default ProductsEditPage;
