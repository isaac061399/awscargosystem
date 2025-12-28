// Components Imports
import Configuration from '@/views-cus/configuration/Configuration';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ConfigurationPage = withAuthPage(
  ['configuration.view'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <Configuration />
      </TranslationsProvider>
    );
  }
);

export default ConfigurationPage;
