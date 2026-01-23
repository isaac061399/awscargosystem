// Components Imports
import Invoices from '@/views-cus/invoices/Invoices';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const InvoicesPage = withAuthPage(['invoices.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Invoices />
    </TranslationsProvider>
  );
});

export default InvoicesPage;
