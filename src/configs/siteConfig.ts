// Type Imports
import type { Mode } from '@core/types';

export type Config = {
  version: string;
  authorName: string;
  authorUrl: string;
  siteName: string;
  siteLogo: string;
  siteFromEmail: string;
  appName: string;
  appFromEmail: string;
  settingsCookieName: string;
  mode: Mode;
  layoutPadding: number;
  compactContentWidth: number;
  disableRipple: boolean;
};

const siteConfig: Config = {
  version: '2.1.0',
  authorName: 'Pangea Holdings',
  authorUrl: 'https://pangea.cr',
  siteName: `AWS Cargo & Courier`,
  siteLogo: '/logos/logo.svg',
  siteFromEmail: 'AWS Cargo & Courier <noreply@pangea.cr>',
  appName: 'AWS Cargo & Courier',
  appFromEmail: 'AWS Cargo & Courier <noreply@pangea.cr>',
  settingsCookieName: 'awscargo-system-settings',
  mode: 'light', // 'light', 'dark'
  layoutPadding: 24, // Common padding for header, content, footer layout components (in px)
  compactContentWidth: 1440, // in px
  disableRipple: false // true, false
};

export default siteConfig;
