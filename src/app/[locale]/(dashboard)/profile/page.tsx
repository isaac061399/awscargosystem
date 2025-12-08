// Components Imports
import Profile from '@views/profile/Profile';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const AdministratorsNewPage = withAuthPage([], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Profile />
    </TranslationsProvider>
  );
});

export default AdministratorsNewPage;
