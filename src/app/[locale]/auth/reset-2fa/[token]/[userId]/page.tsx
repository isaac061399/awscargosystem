// Component Imports
import Reset2FA from '@views/auth/Reset2FA';

// Server Action Imports
import withoutAuthPage from '@libs/auth/withoutAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const Reset2FAPage = withoutAuthPage(
  async ({ params }: { params: Promise<{ token: string; userId: string; locale: string }> }) => {
    const { token, userId, locale } = await params;

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={locale}>
        <Reset2FA token={token} userId={userId} />
      </TranslationsProvider>
    );
  }
);

export default Reset2FAPage;
