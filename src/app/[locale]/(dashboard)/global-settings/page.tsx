// Controller Imports
import { getGlobalSettings } from '@controllers/GlobalSettings.Controller';

// Components Imports
import GlobalSettings from '@views/global-settings/GlobalSettings';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

import i18nConfigApp from '@/configs/i18nConfigApp';

const GlobalSettingsPage = withAuthPage(
  ['global-settings.view'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    const globalSettings = await getGlobalSettings(i18nConfigApp.defaultLocale);

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <GlobalSettings lang={i18nConfigApp.defaultLocale} globalSettings={globalSettings} />
      </TranslationsProvider>
    );
  }
);

export default GlobalSettingsPage;
