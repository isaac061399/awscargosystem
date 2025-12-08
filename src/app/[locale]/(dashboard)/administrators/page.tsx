// Components Imports
import Administrators from '@views/administrators/Administrators';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const AdministratorsPage = withAuthPage(
  ['administrators.list'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <Administrators />
      </TranslationsProvider>
    );
  }
);

export default AdministratorsPage;
