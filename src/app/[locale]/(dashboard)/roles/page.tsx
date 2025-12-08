// Components Imports
import Roles from '@views/roles/Roles';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const RolesPage = withAuthPage(['roles.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Roles />
    </TranslationsProvider>
  );
});

export default RolesPage;
