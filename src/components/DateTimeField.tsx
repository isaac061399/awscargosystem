'use client';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import 'moment/locale/es';

interface DateTimeFieldProps {
  locale: string;
}

const DateTimeField = (props: DateTimePickerProps & DateTimeFieldProps) => {
  const { locale, ...restProps } = props;

  return (
    <LocalizationProvider adapterLocale={locale} dateAdapter={AdapterMoment}>
      <DateTimePicker {...restProps} />
    </LocalizationProvider>
  );
};

export default DateTimeField;
