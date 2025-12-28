// Components Imports
import ClientsEdition from '@/views-cus/clients/ClientsEdition/ClientsEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';
import { loadAddressData } from '@controllers/Address.Controller';

const ClientsNewPage = withAuthPage(['clients.create'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  const provinces = await loadAddressData();

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <ClientsEdition provinces={provinces} />
    </TranslationsProvider>
  );
});

export default ClientsNewPage;
