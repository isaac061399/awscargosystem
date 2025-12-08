import type { Metadata, Viewport } from 'next';

import siteConfig from '@/configs/siteConfig';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'contain',
  themeColor: '#ffffff'
};

export const metadata: Metadata = {
  title: `${siteConfig.siteName} - API Documentation`,
  description: `${siteConfig.siteName} API is a RESTful service that enables seamless integration with external applications, allowing them to access and interact with data efficiently.`,
  alternates: {
    canonical: `${process.env.NEXTAUTH_URL}/api-doc`
  },
  robots: process.env.NODE_ENV === 'production' ? 'index, follow' : 'noindex, nofollow',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
