// Components Imports
import CashRegisters from '@/views-cus/cash-registers/CashRegisters';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const CashRegistersPage = withAuthPage(
  ['cash-registers.list'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <CashRegisters />
      </TranslationsProvider>
    );
  }
);

export default CashRegistersPage;
