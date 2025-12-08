// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getUser } from '@controllers/User.Controller';

// Components Imports
import UsersEdition from '@views/users/UsersEdition/UsersEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const AdministratorsNewPage = withAuthPage(
  ['users.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const user = await getUser(Number(id));

    if (!user) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <UsersEdition user={user} />
      </TranslationsProvider>
    );
  }
);

export default AdministratorsNewPage;
