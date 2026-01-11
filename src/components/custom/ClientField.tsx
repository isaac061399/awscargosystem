import { useRef, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';

import { requestSearchClients } from '@/helpers/request';

type ClientFieldProps = {
  isBilling?: boolean;
  inputRef?: React.Ref<any>;
  initialOptions: any[];
  isOptionEqualToValue: (option: any, value: any) => boolean;
  loadingText: string;
  noOptionsText: string;
  value: any;
  onChange: (value: any) => void;
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  error?: boolean;
  color?: 'error' | 'primary';
  helperText?: string | false;
  disabled?: boolean;
};

const ClientField = ({
  isBilling,
  inputRef,
  initialOptions,
  isOptionEqualToValue,
  loadingText,
  noOptionsText,
  value,
  onChange,
  id,
  name,
  label,
  placeholder,
  error,
  color,
  helperText,
  disabled
}: ClientFieldProps) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any[]>(initialOptions ?? []);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchClients = async (search: string) => {
    if (!search.trim()) {
      setOptions([]);

      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);

      const result = await requestSearchClients({ search, is_billing: isBilling }, 'es');

      setOptions(result.valid ? result.data : []);

      setLoading(false);
    }, 500); // 500ms debounce
  };

  return (
    <Autocomplete
      options={options}
      isOptionEqualToValue={isOptionEqualToValue}
      value={value}
      getOptionLabel={(option) => formatOption(option)}
      onInputChange={(event, value, reason) => {
        if (['input', 'clear'].includes(reason)) {
          fetchClients(value);
        }
      }}
      onChange={(event, value) => {
        onChange?.(value);
      }}
      loading={loading}
      loadingText={loadingText}
      noOptionsText={noOptionsText}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          id={id}
          name={name}
          label={label}
          placeholder={placeholder}
          error={error}
          color={color}
          helperText={helperText}
          disabled={disabled}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  );
};

const formatOption = (option: any) => {
  const extras = [];

  if (option.office) {
    extras.push(option.office.name);
  }

  if (option.box_number) {
    extras.push(option.box_number);
  }

  if (option.identification) {
    extras.push(option.identification);
  }

  if (option.email) {
    extras.push(option.email);
  }

  if (extras.length === 0) {
    return `${option.full_name}`;
  }

  return `${option.full_name} (${extras.join(' - ')})`;
};

export default ClientField;
