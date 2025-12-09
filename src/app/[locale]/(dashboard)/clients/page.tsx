// Components Imports
import Clients from '@/views-cus/clients/Clients';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ClientsPage = withAuthPage(['clients.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Clients />
    </TranslationsProvider>
  );
});

export default ClientsPage;
