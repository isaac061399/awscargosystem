// Components Imports
import Orders from '@/views-cus/orders/Orders';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const OrdersPage = withAuthPage(['orders.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Orders />
    </TranslationsProvider>
  );
});

export default OrdersPage;
