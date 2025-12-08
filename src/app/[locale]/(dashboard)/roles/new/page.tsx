// Controller Imports
import { getAllPermissions } from '@controllers/Permissions.Controller';

// Components Imports
import RolesEdition from '@views/roles/RolesEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const RolesNewPage = withAuthPage(['roles.create'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  const permissions = await getAllPermissions();

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <RolesEdition permissions={permissions} />
    </TranslationsProvider>
  );
});

export default RolesNewPage;
