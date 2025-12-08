'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, FormControl, MenuItem, Select } from '@mui/material';

import i18nConfigApp from '@/configs/i18nConfigApp';

interface LocaleFilterProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: any) => void;
}

const LocaleFilter = ({ id, name, value, onChange }: LocaleFilterProps) => {
  const { t } = useTranslation('common');
  const textT: any = useMemo(() => t('localeFilter', { returnObjects: true, default: {} }), [t]);

  if (Object.keys(i18nConfigApp.localesLabel).length <= 1) return null;

  return (
    <Box sx={{ minWidth: 120 }} className="mb-3">
      <FormControl fullWidth>
        <Select
          size="small"
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          slotProps={{ input: { sx: { p: '7.5px 44px 7.5px 14px !important' } } }}>
          <MenuItem value="all">{textT?.allLabel}</MenuItem>
          {Object.keys(i18nConfigApp.localesLabel).map((lang, i) => (
            <MenuItem key={`langOption-${i}`} value={lang}>
              {i18nConfigApp.localesLabel[lang as keyof typeof i18nConfigApp.localesLabel]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LocaleFilter;
