// Controller Imports
import { getConfiguration } from '@/controllers/Configuration.Controller';

// Components Imports
import OrdersEdition from '@/views-cus/orders/OrdersEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const OrdersNewPage = withAuthPage(['orders.create'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  const config = await getConfiguration();

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <OrdersEdition config={config} />
    </TranslationsProvider>
  );
});

export default OrdersNewPage;
