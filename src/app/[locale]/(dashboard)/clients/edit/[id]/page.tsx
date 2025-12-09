// Next Imports
import { redirect } from 'next/navigation';

// Components Imports
import ClientsEdition from '@/views-cus/clients/ClientsEdition/ClientsEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';
import { loadAddressData } from '@controllers/Address.Controller';
import { getClient } from '@controllers/Client.Controller';

const ClientsNewPage = withAuthPage(
  ['clients.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const provinces = await loadAddressData();

    const { id } = await params;
    const client = await getClient(Number(id));

    if (!client) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <ClientsEdition provinces={provinces} client={client} />
      </TranslationsProvider>
    );
  }
);

export default ClientsNewPage;
