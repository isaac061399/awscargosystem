'use client';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { Box } from '@mui/material';

import 'moment/locale/es';

interface DateRangeFieldProps {
  locale: string;
  startDateProps: DatePickerProps;
  endDateProps: DatePickerProps;
}

const DateRangeField = (props: DateRangeFieldProps) => {
  const { locale, startDateProps, endDateProps } = props;

  return (
    <LocalizationProvider adapterLocale={locale} dateAdapter={AdapterMoment}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <DatePicker
          {...startDateProps}
          maxDate={endDateProps.defaultValue || undefined} // Prevents selecting an start date after end
        />
        <span> – </span>
        <DatePicker
          {...endDateProps}
          minDate={startDateProps.defaultValue || undefined} // Prevents selecting an end date before start
          disabled={!Boolean(startDateProps.defaultValue)} // Prevents selecting and end date before selecting start
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangeField;
