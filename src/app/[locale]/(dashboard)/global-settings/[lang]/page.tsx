// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getGlobalSettings } from '@controllers/GlobalSettings.Controller';

// Components Imports
import GlobalSettings from '@views/global-settings/GlobalSettings';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

import i18nConfigApp from '@/configs/i18nConfigApp';

const GlobalSettingsLangPage = withAuthPage(
  ['global-settings.view'],
  async ({ params }: { params: Promise<{ locale: string; lang: string }> }) => {
    const { lang } = await params;

    if (i18nConfigApp.locales.includes(lang) === false) {
      redirect('/not-found');
    }

    const globalSettings = await getGlobalSettings(lang);

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <GlobalSettings lang={lang} globalSettings={globalSettings} />
      </TranslationsProvider>
    );
  }
);

export default GlobalSettingsLangPage;
