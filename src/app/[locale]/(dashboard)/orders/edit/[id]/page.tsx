// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getOrder } from '@controllers/Order.Controller';

// Components Imports
import OrdersEdition from '@/views-cus/orders/OrdersEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const OrdersEditPage = withAuthPage(
  ['orders.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const order = await getOrder(Number(id));

    if (!order) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <OrdersEdition order={order} />
      </TranslationsProvider>
    );
  }
);

export default OrdersEditPage;
