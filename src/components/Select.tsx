'use client';

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  type SelectChangeEvent
} from '@mui/material';

interface SelectProps {
  options: { value: string | number | readonly string[]; label: string }[];
  fullWidth?: boolean;
  required?: boolean;
  multiple?: boolean;
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string | string[];
  onChange?: (event: SelectChangeEvent<string | string[]>, child: React.ReactNode) => void;
  error?: boolean;
  color?: 'info' | 'error' | 'primary' | 'secondary' | 'success' | 'warning';
  helperText?: string | false;
  disabled?: boolean;
}

const Select = (props: SelectProps) => {
  const {
    options,
    fullWidth,
    required,
    multiple,
    id,
    name,
    label,
    placeholder,
    value,
    onChange,
    error,
    color,
    helperText,
    disabled
  } = props;

  const hasLabel = Boolean(label);
  const labelId = `${id || name}-label`;
  const selectLabel = label && required ? `${label} *` : label;

  return (
    <FormControl fullWidth={fullWidth} required={required} error={error}>
      {hasLabel && <InputLabel id={labelId}>{label}</InputLabel>}
      <MuiSelect
        fullWidth={fullWidth}
        multiple={multiple}
        color={color}
        labelId={labelId}
        id={id}
        name={id}
        value={value}
        label={selectLabel}
        onChange={onChange}
        disabled={disabled}>
        {Boolean(placeholder) && <MenuItem value="">{placeholder}</MenuItem>}
        {options.map((o, i) => (
          <MenuItem key={`select-${id || name}-option-${i}`} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {Boolean(helperText) && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default Select;
