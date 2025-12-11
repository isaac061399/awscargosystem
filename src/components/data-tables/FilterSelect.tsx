'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select } from '@mui/material';

interface FilterSelectProps {
  id?: string;
  name?: string;
  allLabel?: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (e: any) => void;
}

const FilterSelect = ({ id, name, allLabel, options, value, onChange }: FilterSelectProps) => {
  const { t } = useTranslation('common');
  const textT: any = useMemo(() => t('filterSelect', { returnObjects: true, default: {} }), [t]);

  return (
    <Select
      size="small"
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      displayEmpty
      inputProps={{ 'aria-label': 'Without label' }}
      className="mb-3">
      <MenuItem value="">
        <em>{allLabel || textT?.allLabel}</em>
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default FilterSelect;
