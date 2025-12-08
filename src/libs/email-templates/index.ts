import replace from 'key-value-replace';

import i18nConfig from '@/configs/i18nConfig';
import i18nConfigApp from '@/configs/i18nConfigApp';

import siteConfig from '@/configs/siteConfig';
import { settings, devicePlatforms, socialMedia } from '@libs/constants';

export const getTemplate = async (template: string, data: object, lang?: string) => {
  const templateContent: any = await getFileTemplate('templates', template, lang || i18nConfig.defaultLocale);

  const constantsReplace = {
    siteName: siteConfig.siteName,
    currentYear: new Date().getFullYear()
  };

  const response = {
    subject: replace(templateContent.subject, { ...constantsReplace, ...data }),
    content: replace(templateContent.content, { ...constantsReplace, ...data })
  };

  return response;
};

export const getTemplateApp = async (template: string, data: object, lang?: string) => {
  const templateContent: any = await getFileTemplate('app-templates', template, lang || i18nConfigApp.defaultLocale);

  const footerData = generateFooterDataApp(settings, lang || i18nConfigApp.defaultLocale);

  const constantsReplace = {
    primaryColor: settings.primaryColor,
    bannerImage: settings.banner,
    siteName: siteConfig.siteName,
    appName: siteConfig.appName,
    stores: footerData.stores,
    social: footerData.social,
    links: footerData.links,
    currentYear: new Date().getFullYear()
  };

  const response = {
    subject: replace(templateContent.subject, { ...constantsReplace, ...data }),
    content: replace(templateContent.content, { ...constantsReplace, ...data })
  };

  return response;
};

const getFileTemplate = async (path = 'templates', template: string, lang: string) => {
  const templateContent: string = await new Promise((resolve) => {
    import(`./${path}/${lang}/${template}`)
      .then((obj) => {
        resolve(obj.default);
      })
      .catch((error) => {
        console.error(`EmailTemplateError: ${error}`);
        resolve('');
      });
  });

  return templateContent;
};

const generateFooterDataApp = (settingsData: any, lang: string) => {
  const result = {
    stores: '',
    social: '',
    links: ''
  };

  // stores
  if (settingsData.app_store_url !== '') {
    result.stores += `<td><a href="${settingsData.app_store_url}"><img src="${devicePlatforms.IOS.emailIcon}" alt="App Store" height="50"></a></td>`;
  }

  if (settingsData.play_store_url !== '') {
    result.stores += `<td><a href="${settingsData.play_store_url}"><img src="${devicePlatforms.ANDROID.emailIcon}" alt="Google Play" height="50"></a></td>`;
  }

  // social
  result.social += settingsData.social_media
    .map((s: { type: keyof typeof socialMedia; url: string }) => {
      const { type, url } = s;

      return `<td><a href="${url}"><img src="${socialMedia[type]?.emailIcon}" alt="${type}" width="25"></a></td>`;
    })
    .join('');

  // links
  const linksLabels = settingsData.linkLabels[lang];
  const links = [];

  if (settingsData.website_url !== '') {
    links.push(
      `<a href="${settingsData.website_url}" style="color:${settings.primaryColor}; text-decoration:none;">${linksLabels.visit}</a>`
    );
  }

  if (settingsData.terms_of_use_url !== '') {
    links.push(
      `<a href="${settingsData.terms_of_use_url}" style="color:${settings.primaryColor}; text-decoration:none;">${linksLabels.terms}</a>`
    );
  }

  if (settingsData.privacy_policy_url !== '') {
    links.push(
      `<a href="${settingsData.privacy_policy_url}" style="color:${settings.primaryColor}; text-decoration:none;">${linksLabels.privacy}</a>`
    );
  }

  result.links = links.join(' | ');

  return result;
};
