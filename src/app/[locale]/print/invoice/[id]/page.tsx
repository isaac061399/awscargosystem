import '../../print.css';
import './styles.css';

// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getInvoice } from '@/controllers/Invoice.Controller';

// Components Imports
import Invoice from '@/views-cus/print/Invoice';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const InvoicePrintPage = withAuthPage(
  [],
  async ({
    params,
    searchParams
  }: {
    params: Promise<{ locale: string; id: string }>;
    searchParams: Promise<{ or?: string }>;
  }) => {
    const { id } = await params;

    const invoice = await getInvoice(parseInt(id));
    if (!invoice) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <Invoice invoice={invoice} original={(await searchParams).or} />
      </TranslationsProvider>
    );
  }
);

export default InvoicePrintPage;
