// Controller Imports
import { getAllRoles } from '@controllers/Role.Controller';
import { getAllOffices } from '@/controllers/Office.Controller';

// Components Imports
import AdministratorsEdition from '@views/administrators/AdministratorsEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const AdministratorsNewPage = withAuthPage(
  ['administrators.create'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    const roles = await getAllRoles();
    const offices = await getAllOffices();

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <AdministratorsEdition roles={roles} offices={offices} />
      </TranslationsProvider>
    );
  }
);

export default AdministratorsNewPage;
