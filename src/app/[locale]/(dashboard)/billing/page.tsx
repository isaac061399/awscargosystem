// Auth Imports
import { getServerSession } from 'next-auth';

// Components Imports
import Billing from '@/views-cus/billing/Billing';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';
import { getCashRegisterAdmin } from '@/controllers/CashRegister.Controller';

import authOptions from '@libs/auth/authOptions';

const BillingPage = withAuthPage(['billing.create'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  const session = await getServerSession(authOptions);
  const cashRegister = await getCashRegisterAdmin(session?.user?.email || '');

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Billing cashRegister={cashRegister} />
    </TranslationsProvider>
  );
});

export default BillingPage;
