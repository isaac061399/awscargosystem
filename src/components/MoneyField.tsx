'use client';

import { TextField, type TextFieldProps } from '@mui/material';
import { NumericFormat } from 'react-number-format';

interface MoneyFieldProps {
  value?: unknown;
  onChange?: (event: { target: { id?: string; name?: string; value: unknown } }) => void;
  decimalScale?: number;
  decimalSeparator?: string;
  thousandSeparator?: string;
  prefix?: string;
  suffix?: string;
}

const MoneyField = (props: MoneyFieldProps & TextFieldProps) => {
  const { value, onChange, decimalScale, decimalSeparator, thousandSeparator, prefix, suffix, ...restProps } = props;
  const inputProps = restProps as any;

  return (
    <NumericFormat
      {...inputProps}
      allowNegative={false}
      customInput={TextField}
      decimalScale={decimalScale || 2}
      prefix={prefix}
      suffix={suffix}
      thousandSeparator={thousandSeparator || ','}
      decimalSeparator={decimalSeparator || '.'}
      value={value}
      onValueChange={(values) => {
        if (onChange) {
          onChange({ target: { id: inputProps.id, name: inputProps.name, value: values?.value } });
        }
      }}
    />
  );
};

export default MoneyField;
