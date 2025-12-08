// Component Imports
import Login from '@views/auth/Login';

// Server Action Imports
import withoutAuthPage from '@libs/auth/withoutAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const LoginPage = withoutAuthPage(async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Login />
    </TranslationsProvider>
  );
});

export default LoginPage;
