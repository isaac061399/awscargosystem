// Components Imports
import MediaLibrary from '@views/media-library/MediaLibrary';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const MediaLibraryPage = withAuthPage(['media.list'], async ({ params }: { params: Promise<{ locale: string }> }) => {
  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <MediaLibrary />
    </TranslationsProvider>
  );
});

export default MediaLibraryPage;
