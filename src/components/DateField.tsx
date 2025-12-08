'use client';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import 'moment/locale/es';

interface DateFieldProps {
  locale: string;
}

const DateField = (props: DatePickerProps & DateFieldProps) => {
  const { locale, ...restProps } = props;

  return (
    <LocalizationProvider adapterLocale={locale} dateAdapter={AdapterMoment}>
      <DatePicker {...restProps} />
    </LocalizationProvider>
  );
};

export default DateField;
