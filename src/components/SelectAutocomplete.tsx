'use client';

import { Autocomplete, TextField } from '@mui/material';

interface SelectAutocompleteProps {
  fullWidth: boolean;
  options: any[];
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: any;
  error?: boolean;
  color?: 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';
  helperText?: string | false;
  disabled?: boolean;
  noOptionsText?: string;
  getOptionLabel: (option: any) => string;
  renderOption: (props: any, option: any) => React.ReactNode;
  onChange?: (event: React.ChangeEvent<unknown>, value: any) => void;
}

const SelectAutocomplete: React.FC<SelectAutocompleteProps> = ({
  options,
  id,
  name,
  label,
  placeholder,
  value,
  error,
  color,
  helperText,
  disabled,
  noOptionsText,
  getOptionLabel,
  renderOption,
  onChange
}) => {
  return (
    <Autocomplete
      options={options}
      fullWidth
      value={value}
      onChange={onChange}
      noOptionsText={noOptionsText}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      renderInput={(params) => (
        <TextField
          {...params}
          id={id}
          name={name}
          label={label}
          placeholder={placeholder}
          error={error}
          color={color}
          helperText={helperText}
          disabled={disabled}
        />
      )}
    />
  );
};

export default SelectAutocomplete;
