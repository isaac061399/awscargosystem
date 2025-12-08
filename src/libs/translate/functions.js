import path from 'path';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';

import i18nConfig from '../../configs/i18nConfig';
import i18nConfigApp from '@/configs/i18nConfigApp';

export async function getCommonTranslations(locale) {
  const config = i18nConfig.pages || {};
  const nsCommon = config['*'] || [];

  return initTranslations(locale, nsCommon);
}

export async function initTranslations(locale, namespaces, i18nInstance, resources) {
  i18nInstance = i18nInstance || createInstance();

  i18nInstance.use(initReactI18next);

  if (!resources) {
    i18nInstance.use(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      resourcesToBackend((language, namespace) => Promise.resolve(require(`@/locales/${language}/${namespace}.json`)))
    );
  }

  await i18nInstance.init({
    lng: locale,
    resources,
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    defaultNS: namespaces[0],
    fallbackNS: namespaces[0],
    ns: namespaces,
    preload: resources ? [] : i18nConfig.locales
  });

  return {
    i18n: i18nInstance,
    resources: i18nInstance.services.resourceStore.data,
    t: i18nInstance.t
  };
}

export async function initTranslationsApi(req, extraNamespaces = []) {
  let locale = req?.headers?.get('accept-language');

  if (!locale) {
    locale = i18nConfig.defaultLocale;
  } else if (!i18nConfig.locales.includes(locale)) {
    locale = i18nConfig.defaultLocale;
  }

  return initTranslations(locale, ['api', ...extraNamespaces]);
}

export function getNextPath(filePath = '') {
  const parts = filePath.split(path.sep);
  const folderIndex = parts.lastIndexOf('app');

  return `/${parts.slice(folderIndex + 1).join(`/`)}`;
}

export async function initTranslationsApp(req, namespaces) {
  namespaces = namespaces ? ['common', ...namespaces] : ['common'];

  let locale = req?.headers?.get('accept-language');

  if (!locale) {
    locale = i18nConfigApp.defaultLocale;
  } else if (!i18nConfigApp.locales.includes(locale)) {
    locale = i18nConfigApp.defaultLocale;
  }

  const i18nInstance = createInstance();

  i18nInstance.use(initReactI18next);

  i18nInstance.use(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    resourcesToBackend((language, namespace) => Promise.resolve(require(`@/locales-app/${language}/${namespace}.json`)))
  );

  await i18nInstance.init({
    lng: locale,
    resources: undefined,
    fallbackLng: i18nConfigApp.defaultLocale,
    supportedLngs: i18nConfigApp.locales,
    defaultNS: namespaces[0],
    fallbackNS: namespaces[0],
    ns: namespaces,
    preload: i18nConfigApp.locales
  });

  return {
    i18n: i18nInstance,
    resources: i18nInstance.services.resourceStore.data,
    t: i18nInstance.t
  };
}
