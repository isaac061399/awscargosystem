'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select, Typography } from '@mui/material';

import i18nConfig from '@/configs/i18nConfig';

const setCookie = (locale: string) => {
  document.cookie = `NEXT_LOCALE=${locale}; max-age=${365 * 24 * 60 * 60}; path=/`;
};

const LangSelector = () => {
  const router = useRouter();
  const currentPathname = usePathname();
  const { i18n } = useTranslation();
  const locales = i18nConfig.locales;
  const localesLabel = i18nConfig.localesLabel;
  const defaultLocale = i18nConfig.defaultLocale;
  const currentLocale = i18n.language;

  if (locales.length === 1) {
    return null;
  }

  const handleChangeLang = (newLocale: string) => {
    setCookie(newLocale);

    if (currentLocale === defaultLocale) {
      router.push('/' + newLocale + currentPathname);
    } else {
      router.push(currentPathname.replace(`/${currentLocale}`, `/${newLocale}`));
    }

    router.refresh();
  };

  return (
    <Select
      variant="standard"
      disableUnderline
      value={currentLocale}
      onChange={(e) => handleChangeLang(e.target.value as string)}>
      {locales.map((l) => (
        <MenuItem key={`${l}`} value={l}>
          <Typography className="text-text-primary">{localesLabel[l as keyof typeof localesLabel]}</Typography>
        </MenuItem>
      ))}
    </Select>
  );
};

export default LangSelector;
