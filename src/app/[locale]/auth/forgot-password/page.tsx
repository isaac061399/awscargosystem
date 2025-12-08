// Component Imports
import ForgotPassword from '@views/auth/ForgotPassword';

// Server Action Imports
import withoutAuthPage from '@libs/auth/withoutAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ForgotPasswordPage = withoutAuthPage(async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <ForgotPassword />
    </TranslationsProvider>
  );
});

export default ForgotPasswordPage;
