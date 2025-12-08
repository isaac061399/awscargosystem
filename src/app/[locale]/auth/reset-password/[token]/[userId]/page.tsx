// Component Imports
import ResetPassword from '@views/auth/ResetPassword';

// Server Action Imports
import withoutAuthPage from '@libs/auth/withoutAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ResetPasswordPage = withoutAuthPage(
  async ({ params }: { params: Promise<{ token: string; userId: string; locale: string }> }) => {
    const { token, userId, locale } = await params;

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={locale}>
        <ResetPassword token={token} userId={userId} />
      </TranslationsProvider>
    );
  }
);

export default ResetPasswordPage;
