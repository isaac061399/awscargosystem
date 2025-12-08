import 'server-only';

// local imports
import TranslationsProviderClient from './TranslationProviderClient';
import { initTranslations } from './functions';

// root imports
import i18nConfig from '@/configs/i18nConfig';

interface TranslationsProviderProps {
  children: React.ReactNode;
  page: string;
  locale: string;
}

export default async function TranslationsProvider({ children, page, locale }: TranslationsProviderProps) {
  const config = (i18nConfig.pages as any) || {};
  const nsCommon = config['*'] || [];
  const nsPage = config[page] || [];
  const namespaces = [...nsCommon, ...nsPage];

  const { resources } = await initTranslations(locale, namespaces);

  return (
    <TranslationsProviderClient namespaces={namespaces} locale={locale} resources={resources}>
      {children}
    </TranslationsProviderClient>
  );
}
