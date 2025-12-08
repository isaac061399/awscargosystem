'use client';

// lib imports
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';

// local imports
import { initTranslations } from './functions';

interface TranslationsProviderClientProps {
  children: React.ReactNode;
  locale: string;
  namespaces: string[];
  resources: any;
}

export default function TranslationsProviderClient({
  children,
  locale,
  namespaces,
  resources
}: TranslationsProviderClientProps) {
  const i18n = createInstance();

  initTranslations(locale, namespaces, i18n, resources);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
