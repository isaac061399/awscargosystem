'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, InputAdornment, TextField } from '@mui/material';

interface FilterSearchProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: any) => void;
  onSearch: () => void;
}

const FilterSearch = ({ id, name, value, onChange, onSearch }: FilterSearchProps) => {
  const { t } = useTranslation('common');
  const textT: any = useMemo(() => t('filterSearch', { returnObjects: true, default: {} }), [t]);

  return (
    <form
      noValidate
      className="mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}>
      <TextField
        size="small"
        type="text"
        id={id}
        name={name}
        placeholder={textT?.placeholder}
        value={value}
        onChange={onChange}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <i className="ri-search-line"></i>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.preventDefault();
                    onSearch();
                  }}>
                  <i className="ri-arrow-right-line"></i>
                </IconButton>
              </InputAdornment>
            )
          }
        }}
      />
    </form>
  );
};

export default FilterSearch;
