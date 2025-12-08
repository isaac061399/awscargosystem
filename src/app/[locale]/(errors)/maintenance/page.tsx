// i18n Imports
import { dir } from 'i18next';

// Component Imports
import Providers from '@components/Providers';
import BlankLayout from '@layouts/BlankLayout';
import Maintenance from '@views/errors/Maintenance';

// Server Action Imports
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const MaintenancePage = async ({ params }: { params: Promise<{ locale: string }> }) => {
  // Vars
  const { locale } = await params;
  const direction = dir(locale);

  return (
    <Providers direction={direction}>
      <TranslationsProvider page={getNextPath(__dirname)} locale={locale}>
        <BlankLayout>
          <Maintenance />
        </BlankLayout>
      </TranslationsProvider>
    </Providers>
  );
};

export default MaintenancePage;
