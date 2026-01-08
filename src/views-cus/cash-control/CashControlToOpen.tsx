'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useRouter } from 'next/navigation';

import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid } from '@mui/material';

// Component Imports
import MoneyField from '@/components/MoneyField';
import Select from '@/components/Select';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';
import { useConfig } from '@/components/ConfigProvider';

// Utils Imports
import { requestOpenCashRegister } from '@/helpers/request';
import { currencies } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const CashToOpen = ({
  setAlertState,
  redirect
}: {
  setAlertState: React.Dispatch<React.SetStateAction<any>>;
  redirect?: string;
}) => {
  const { data: admin } = useAdmin();
  const canOpen = hasAllPermissions('cash-control.open', admin.permissions);
  const canSelectOffice = admin.office === null;

  const { offices } = useConfig();

  const router = useRouter();
  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('cash-control:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('cash-control:formOpen', { returnObjects: true, default: {} }), [t]);

  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        office_id: '',
        cash_balance_crc: '',
        cash_balance_usd: '',
        confirmation: false
      }),
      []
    ),
    validationSchema: yup.object({
      office_id: canSelectOffice ? yup.string().required(formT?.errors?.office_id) : yup.string(),
      cash_balance_crc: yup.number().typeError(formT?.errors?.invalidAmount).required(formT?.errors?.cash_balance_crc),
      cash_balance_usd: yup.number().typeError(formT?.errors?.invalidAmount).required(formT?.errors?.cash_balance_usd),
      confirmation: yup.boolean().oneOf([true], formT?.errors?.confirmation).required(formT?.errors?.confirmation)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });
      setIsLoading(true);

      try {
        const data = {
          office_id: canSelectOffice ? values.office_id : undefined,
          cash_balance_crc: values.cash_balance_crc,
          cash_balance_usd: values.cash_balance_usd
        };

        const result = await requestOpenCashRegister(data, i18n.language);

        if (!result.valid) {
          setIsLoading(false);

          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        router.refresh();

        if (redirect) {
          router.push(`/${redirect}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        setIsLoading(false);

        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Grid container spacing={5}>
            {canSelectOffice && (
              <Grid size={{ xs: 12, md: 12 }}>
                <Select
                  options={offices.map((o) => ({ value: o.id, label: o.name }))}
                  required
                  fullWidth
                  id="office_id"
                  name="office_id"
                  label={formT?.labels?.office_id}
                  value={formik.values.office_id}
                  onChange={formik.handleChange}
                  error={Boolean(formik.touched.office_id && formik.errors.office_id)}
                  color={Boolean(formik.touched.office_id && formik.errors.office_id) ? 'error' : 'primary'}
                  helperText={
                    formik.touched.office_id && formik.errors.office_id ? (formik.errors.office_id as string) : ''
                  }
                  disabled={formik.isSubmitting || isLoading}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 12 }}>
              <MoneyField
                fullWidth
                required
                type="text"
                decimalScale={2}
                decimalSeparator="."
                thousandSeparator=","
                prefix={`${currencies.CRC.symbol} `}
                id="cash_balance_crc"
                name="cash_balance_crc"
                label={formT?.labels?.cash_balance_crc}
                placeholder={formT?.placeholders?.cash_balance_crc}
                value={formik.values.cash_balance_crc}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.cash_balance_crc && formik.errors.cash_balance_crc)}
                color={Boolean(formik.touched.cash_balance_crc && formik.errors.cash_balance_crc) ? 'error' : 'primary'}
                helperText={formik.touched.cash_balance_crc && (formik.errors.cash_balance_crc as string)}
                disabled={formik.isSubmitting || isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <MoneyField
                fullWidth
                required
                type="text"
                decimalScale={2}
                decimalSeparator="."
                thousandSeparator=","
                prefix={`${currencies.USD.symbol} `}
                id="cash_balance_usd"
                name="cash_balance_usd"
                label={formT?.labels?.cash_balance_usd}
                placeholder={formT?.placeholders?.cash_balance_usd}
                value={formik.values.cash_balance_usd}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.cash_balance_usd && formik.errors.cash_balance_usd)}
                color={Boolean(formik.touched.cash_balance_usd && formik.errors.cash_balance_usd) ? 'error' : 'primary'}
                helperText={formik.touched.cash_balance_usd && (formik.errors.cash_balance_usd as string)}
                disabled={formik.isSubmitting || isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <FormControl error={Boolean(formik.touched.confirmation && formik.errors.confirmation)}>
                <FormGroup>
                  <FormControlLabel
                    required
                    id="confirmation"
                    name="confirmation"
                    control={
                      <Checkbox
                        checked={formik.values.confirmation}
                        onChange={formik.handleChange}
                        disabled={formik.isSubmitting || isLoading}
                      />
                    }
                    label={formT?.labels?.confirmation}
                  />
                </FormGroup>
                <FormHelperText>{formik.touched.confirmation && (formik.errors.confirmation as string)}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={formik.isSubmitting || isLoading || !canOpen}
                fullWidth>
                {textT?.btnOpen}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
};

export default CashToOpen;
