// Auth Imports
import { getServerSession } from 'next-auth';

// Components Imports
import Billing from '@/views-cus/billing/Billing';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';
import { getCashRegisterAdmin } from '@/controllers/CashRegister.Controller';
import { getClientSearchById } from '@/controllers/Client.Controller';

import authOptions from '@libs/auth/authOptions';

const BillingPage = withAuthPage(
  ['billing.create'],
  async ({
    params,
    searchParams
  }: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ client?: string }>;
  }) => {
    const session = await getServerSession(authOptions);
    const cashRegister = await getCashRegisterAdmin(session?.user?.email || '');

    const clientId = (await searchParams).client;
    let client;
    if (clientId) {
      client = await getClientSearchById(parseInt(clientId), cashRegister?.office_id);
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <Billing cashRegister={cashRegister} client={client} />
      </TranslationsProvider>
    );
  }
);

export default BillingPage;
