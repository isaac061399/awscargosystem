// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getInvoice } from '@controllers/Invoice.Controller';

// Components Imports
import InvoicesView from '@/views-cus/invoices/InvoicesView';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const InvoicesViewPage = withAuthPage(
  ['invoices.view'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const invoice = await getInvoice(Number(id));

    if (!invoice) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <InvoicesView invoice={invoice} />
      </TranslationsProvider>
    );
  }
);

export default InvoicesViewPage;
