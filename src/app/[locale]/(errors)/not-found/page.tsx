// i18n Imports
import { dir } from 'i18next';

// Component Imports
import Providers from '@components/Providers';
import BlankLayout from '@layouts/BlankLayout';
import NotFound from '@views/errors/NotFound';

// Server Action Imports
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const NotFoundPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
  // Vars
  const { locale } = await params;
  const direction = dir(locale);

  return (
    <Providers direction={direction}>
      <TranslationsProvider page={getNextPath(__dirname)} locale={locale}>
        <BlankLayout>
          <NotFound />
        </BlankLayout>
      </TranslationsProvider>
    </Providers>
  );
};

export default NotFoundPage;
