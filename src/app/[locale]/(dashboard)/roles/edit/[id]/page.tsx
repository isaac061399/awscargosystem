// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getAllPermissions } from '@controllers/Permissions.Controller';
import { getRole } from '@controllers/Role.Controller';

// Components Imports
import RolesEdition from '@views/roles/RolesEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const RolesNewPage = withAuthPage(
  ['roles.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const permissions = await getAllPermissions();

    const { id } = await params;
    const role = await getRole(Number(id));

    if (!role) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <RolesEdition permissions={permissions} role={role} />
      </TranslationsProvider>
    );
  }
);

export default RolesNewPage;
