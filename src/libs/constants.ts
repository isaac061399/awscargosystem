import type { AuthProvider, DevicePlatform } from '@/prisma/generated/client';
import { getBucketEndpoint } from '@services/aws-s3';

const bucketEndpoint = getBucketEndpoint();

// Dashboard Constants
export const imageContentTypes = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPG',
  'image/gif': 'GIF',
  'image/webp': 'WebP',
  'image/svg+xml': 'SVG',
  'image/bmp': 'BMP',
  'image/tiff': 'TIFF',
  'image/x-icon': 'ICO',
  'image/vnd.microsoft.icon': 'ICO',
  'image/heif': 'HEIF',
  'image/heic': 'HEIC',
  'image/avif': 'AVIF'
};

export const currencies: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'USD' },
  CRC: { symbol: '₡', name: 'CRC' }
};

export const defaultConfigId = 1;

export const boxNumberPrefix = 'AWS-';

export const defaultActivityCode = '00';

export const officeCookie = { name: 'office', maxAge: 60 * 60 * 24 * 365 };

export const additionalExchangeRate = 6;

export const sellersPages = ['Amazon', 'eBay', 'AliExpress', 'Shein', 'Target'];

// App Constants

export const userProviders: Record<AuthProvider, { icon: string }> = {
  GOOGLE: { icon: 'ri-google-fill' },
  APPLE: { icon: 'ri-apple-fill' },
  FACEBOOK: { icon: 'ri-facebook-fill' },
  TWITTER: { icon: 'ri-twitter-x-fill' }
};

export const devicePlatforms: Record<DevicePlatform, { emailIcon: string }> = {
  IOS: {
    emailIcon: `${bucketEndpoint}email-assets/stores/app-store.png`
  },
  ANDROID: {
    emailIcon: `${bucketEndpoint}email-assets/stores/google-play.png`
  }
};

export const socialMedia = {
  FACEBOOK: {
    emailIcon: `${bucketEndpoint}email-assets/social/facebook.png`
  },
  INSTAGRAM: {
    emailIcon: `${bucketEndpoint}email-assets/social/instagram.png`
  },
  TWITTER: {
    emailIcon: `${bucketEndpoint}email-assets/social/twitter.png`
  },
  YOUTUBE: {
    emailIcon: `${bucketEndpoint}email-assets/social/youtube.png`
  },
  TIKTOK: {
    emailIcon: `${bucketEndpoint}email-assets/social/tiktok.png`
  },
  LINKEDIN: {
    emailIcon: `${bucketEndpoint}email-assets/social/linkedin.png`
  },
  WHATSAPP: {
    emailIcon: `${bucketEndpoint}email-assets/social/whatsapp.png`
  }
};

export const settings = {
  primaryColor: '#004B95',
  banner: 'https://place-hold.it/600x200',
  website_url: 'https://pangea.cr',
  terms_of_use_url: 'https://pangea.cr',
  privacy_policy_url: 'https://pangea.cr',
  app_store_url: 'https://www.apple.com/app-store',
  play_store_url: 'https://play.google.com/store/apps',
  social_media: [
    { type: 'FACEBOOK', url: 'https://pangea.cr' },
    { type: 'INSTAGRAM', url: 'https://pangea.cr' },
    { type: 'TWITTER', url: 'https://pangea.cr' },
    { type: 'YOUTUBE', url: 'https://pangea.cr' },
    { type: 'TIKTOK', url: 'https://pangea.cr' },
    { type: 'LINKEDIN', url: 'https://pangea.cr' },
    { type: 'WHATSAPP', url: 'https://pangea.cr' }
  ],
  support_emails: 'guillermo@pangea.cr',
  linkLabels: {
    en: { visit: 'Visit Us', terms: 'Terms of Use', privacy: 'Privacy Policy' },
    es: { visit: 'Visítanos', terms: 'Términos de Uso', privacy: 'Política de Privacidad' }
  }
};
