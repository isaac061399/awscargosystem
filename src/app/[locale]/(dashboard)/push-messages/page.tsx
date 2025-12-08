// Components Imports
import PushMessages from '@views/push-messages/PushMessages';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PushMessagesPage = withAuthPage(
  ['push-messages.list'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <PushMessages />
      </TranslationsProvider>
    );
  }
);

export default PushMessagesPage;
