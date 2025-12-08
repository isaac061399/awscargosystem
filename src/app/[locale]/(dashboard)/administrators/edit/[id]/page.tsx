// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getAllRoles } from '@controllers/Role.Controller';
import { getAdmin } from '@controllers/Administrator.Controller';

// Components Imports
import AdministratorsEdition from '@views/administrators/AdministratorsEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const AdministratorsNewPage = withAuthPage(
  ['administrators.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const roles = await getAllRoles();

    const { id } = await params;
    const admin = await getAdmin(Number(id));

    if (!admin) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <AdministratorsEdition roles={roles} admin={admin} />
      </TranslationsProvider>
    );
  }
);

export default AdministratorsNewPage;
