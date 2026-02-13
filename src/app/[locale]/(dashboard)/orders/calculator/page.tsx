// Components Imports
import OrdersCalculator from '@/views-cus/orders/OrdersCalculator';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const OrdersNewPage = withAuthPage(
  ['orders.calculator'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <OrdersCalculator />
      </TranslationsProvider>
    );
  }
);

export default OrdersNewPage;
