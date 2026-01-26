import '../../print.css';
import './styles.css';

// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getCashRegister } from '@/controllers/CashRegister.Controller';

// Components Imports
import CashRegister from '@/views-cus/print/CashRegister';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const CashRegisterPrintPage = withAuthPage(
  ['cash-registers.view'],
  async ({
    params,
    searchParams
  }: {
    params: Promise<{ locale: string; id: string }>;
    searchParams: Promise<{ or?: string }>;
  }) => {
    const { id } = await params;

    const cashRegister = await getCashRegister(parseInt(id), true);
    if (!cashRegister) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <CashRegister cashRegister={cashRegister} original={(await searchParams).or} />
      </TranslationsProvider>
    );
  }
);

export default CashRegisterPrintPage;
