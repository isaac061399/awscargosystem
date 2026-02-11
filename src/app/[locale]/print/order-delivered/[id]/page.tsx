import '../../print.css';
import './styles.css';

// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getOrderDelivered } from '@/controllers/Order.Controller';

// Components Imports
import OrderDelivered from '@/views-cus/print/OrderDelivered';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const OrderDeliveredPrintPage = withAuthPage(
  ['orders.edit'],
  async ({
    params,
    searchParams
  }: {
    params: Promise<{ locale: string; id: string }>;
    searchParams: Promise<{ or?: string; products?: string | string[] }>;
  }) => {
    const { id } = await params;
    const { products } = await searchParams;
    const productIds = Array.isArray(products) ? products.map(Number) : products ? [Number(products)] : undefined;

    const orderDelivered = await getOrderDelivered(parseInt(id), productIds);
    if (!orderDelivered) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <OrderDelivered order={orderDelivered} original={(await searchParams).or} />
      </TranslationsProvider>
    );
  }
);

export default OrderDeliveredPrintPage;
