// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css';

// Next Imports
import type { Metadata, Viewport } from 'next';

// i18n Imports
import { dir } from 'i18next';

// Type Imports
import type { ChildrenType } from '@core/types';

// i18n Config Imports
import siteConfig from '@/configs/siteConfig';
import i18nConfig from '@/configs/i18nConfig';

// Translation Imports
import { getCommonTranslations } from '@libs/translate/functions';

// Style Imports
import '@/app/globals.css';

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'contain',
  themeColor: '#ffffff'
};

export const generateMetadata = async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
  const { locale } = await params;
  const { t } = await getCommonTranslations(locale);

  const title = t('common:seo.title');
  const description = t('common:seo.description');

  return {
    title: `${siteConfig.siteName} | ${title}`,
    description,
    alternates: {
      canonical: `${process.env.NEXTAUTH_URL}`
    },
    robots: 'noindex, nofollow',
    icons: {
      icon: [
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', rel: 'shortcut icon' }
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }]
    },
    appleWebApp: {
      title: 'AWS Cargo & Courier'
    },
    manifest: '/site.webmanifest',
    authors: [{ name: siteConfig.authorName, url: siteConfig.authorUrl }],
    other: {
      'x-ua-compatible': 'ie=edge',
      'msapplication-TileColor': '#ffffff'
    }
  };
};

export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

const RootLayout = async ({ children, params }: ChildrenType & { params: Promise<{ locale: string }> }) => {
  // Vars
  const { locale } = await params;
  const direction = dir(locale);

  return (
    <html id="__next" lang={locale} dir={direction}>
      <body className="flex is-full min-bs-full flex-auto flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
