// Components Imports
import ClientsEdition from '@/views-cus/clients/ClientsEdition/ClientsEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';
import { loadAddressData } from '@controllers/Address.Controller';
import { getAllOffices } from '@/controllers/Office.Controller';
import { getConfiguration } from '@/controllers/Configuration.Controller';

const ClientsNewPage = withAuthPage(['clients.create'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  const offices = await getAllOffices();
  const provinces = await loadAddressData();
  const config = await getConfiguration();

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <ClientsEdition offices={offices} provinces={provinces} poundFee={config?.pound_fee ?? 0} />
    </TranslationsProvider>
  );
});

export default ClientsNewPage;
