// Components Imports
import MoneyOutflows from '@/views-cus/money-outflows/MoneyOutflows';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const MoneyOutflowsPage = withAuthPage(
  ['money-outflows.list'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <MoneyOutflows />
      </TranslationsProvider>
    );
  }
);

export default MoneyOutflowsPage;
