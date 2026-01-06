// Next Imports
import { redirect } from 'next/navigation';

// Components Imports
import CashRegistersView from '@/views-cus/cash-registers/CashRegistersView';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';
import { getCashRegister } from '@/controllers/CashRegister.Controller';

const CashRegistersViewPage = withAuthPage(
  ['cash-registers.view'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const cashRegister = await getCashRegister(Number(id));

    if (!cashRegister) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <CashRegistersView cashRegister={cashRegister} />
      </TranslationsProvider>
    );
  }
);

export default CashRegistersViewPage;
