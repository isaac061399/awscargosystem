import { AuthProvider, DevicePlatform, InvoicePaymentCondition } from '@/prisma/generated/enums';
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

export const mailboxPrefix = 'AWS-';

export const additionalExchangeRate = 6;

export const sellersPages = ['Amazon', 'eBay', 'AliExpress', 'Shein', 'Target'];

export const specialPackageDocumentTypes = ['Factura comercial', 'Guía aérea', 'Packing list'];

export const bankAccounts = { BAC: 'BAC Credomatic', BN: 'Banco Nacional' };

export const paymentConditionsDays = {
  [InvoicePaymentCondition.CASH]: 0,
  [InvoicePaymentCondition.CREDIT_6]: 6,
  [InvoicePaymentCondition.CREDIT_8]: 8,
  [InvoicePaymentCondition.CREDIT_16]: 16,
  [InvoicePaymentCondition.CREDIT_25]: 25,
  [InvoicePaymentCondition.CREDIT_30]: 30,
  [InvoicePaymentCondition.CREDIT_45]: 45,
  [InvoicePaymentCondition.CREDIT_60]: 60,
  [InvoicePaymentCondition.CREDIT_90]: 90
};

export const billingDefaultActivityCode = '00';

export const billingDefaultDesc = 'ENVIO';

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
  primaryColor: '#004C97',
  banner: `${bucketEndpoint}email-assets/banner.png`,
  website_url: `https://www.awscargo.com`,
  terms_of_use_url: `https://www.awscargo.com/terms-conditions`,
  privacy_policy_url: `https://www.awscargo.com/privacy-policy`,
  app_store_url: 'https://www.apple.com/app-store',
  play_store_url: 'https://play.google.com/store/apps',
  social_media: [
    { type: 'FACEBOOK', url: 'https://www.facebook.com/AtenasWebShop' },
    { type: 'INSTAGRAM', url: 'https://www.instagram.com/aws_cargo_courier' },
    { type: 'YOUTUBE', url: 'https://www.youtube.com/@atenaswebshop4120' },
    { type: 'WHATSAPP', url: 'https://api.whatsapp.com/send/?phone=50672902221' }
  ],
  support_emails: 'info@awscargo.com',
  linkLabels: {
    en: { visit: 'Visit Us', terms: 'Terms of Use', privacy: 'Privacy Policy' },
    es: { visit: 'Visítanos', terms: 'Términos de Uso', privacy: 'Política de Privacidad' }
  }
};
