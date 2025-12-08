// Components Imports
import Contents from '@views/contents/Contents';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const ContentsPage = withAuthPage(['contents.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Contents />
    </TranslationsProvider>
  );
});

export default ContentsPage;
