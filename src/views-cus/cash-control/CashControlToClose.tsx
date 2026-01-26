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
import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  TextField,
  Typography
} from '@mui/material';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

// Utils Imports
import { requestCloseCashRegister } from '@/helpers/request';
import { formatMoney } from '@libs/utils';
import { currencies } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const getFormCloseConfig = (options: { [key: string]: string }, requiredError: string, invalidError: string) => {
  const labels: { [key: string]: any } = {};
  const initialValues: { [key: string]: any } = {};
  const validationSchemaFields: { [key: string]: any } = {};
  const amounts: { [key: string]: number } = {};

  Object.keys(options).forEach((key) => {
    labels[key] = options[key];
    initialValues[key] = 0;
    validationSchemaFields[key] = yup.number().typeError(invalidError).required(requiredError);
    amounts[key] = parseFloat(key);
  });

  return { labels, initialValues, validationSchemaFields, amounts };
};

const getFormCloseTotal = (options: { [key: string]: number }, values: { [key: string]: number }) => {
  let total = 0;

  Object.keys(options).forEach((key) => {
    total += options[key] * (values[key] || 0);
  });

  return total;
};

const CashToClose = ({
  cashRegister,
  setAlertState,
  setSuccessOpen
}: {
  cashRegister: any;
  setAlertState: React.Dispatch<React.SetStateAction<any>>;
  setSuccessOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { data: admin } = useAdmin();
  const canClose = hasAllPermissions('cash-control.close', admin.permissions);

  const router = useRouter();
  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('cash-control:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('cash-control:formClose', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const moneyT: any = useMemo(() => t('constants:money', { returnObjects: true, default: {} }), [t]);

  const [isLoading, setIsLoading] = useState(false);

  const formCloseConfig = useMemo(
    () => ({
      CRC: getFormCloseConfig(moneyT?.CRC || {}, formT?.errors?.amount, formT?.errors?.invalidAmount),
      USD: getFormCloseConfig(moneyT?.USD || {}, formT?.errors?.amount, formT?.errors?.invalidAmount)
    }),
    [moneyT, formT]
  );

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        crc: formCloseConfig.CRC.initialValues,
        usd: formCloseConfig.USD.initialValues,
        comment: '',
        confirmation: false
      }),
      [formCloseConfig]
    ),
    validationSchema: yup.object({
      crc: yup.object(formCloseConfig.CRC.validationSchemaFields),
      usd: yup.object(formCloseConfig.USD.validationSchemaFields),
      confirmation: yup.boolean().oneOf([true], formT?.errors?.confirmation).required(formT?.errors?.confirmation)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });
      setIsLoading(true);

      try {
        const result = await requestCloseCashRegister(values, i18n.language);

        if (!result.valid) {
          setIsLoading(false);

          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        router.refresh();

        setSuccessOpen(true);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        setIsLoading(false);

        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const lines: { [key: string]: any } = {};
  cashRegister.lines.forEach((line: any) => {
    lines[line.currency] = line;
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      {/* CRC Section */}
      <Divider textAlign="left" sx={{ mb: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
        <Typography variant="h5">{labelsT?.currency?.CRC}</Typography>
      </Divider>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6" component="div" className="font-bold">
            {textT?.cashBalance}: {formatMoney(lines['CRC']?.cash_balance || 0, `${currencies.CRC.symbol} `)}
            {' | '}
            {textT?.total}:{' '}
            {formatMoney(
              getFormCloseTotal(formCloseConfig.CRC.amounts, formik.values.crc),
              `${currencies.CRC.symbol} `
            )}
          </Typography>
        </Grid>
        {Object.keys(formCloseConfig.CRC.initialValues).map((key, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={i}>
            <TextField
              fullWidth
              required
              type="number"
              id={`crc.${key}`}
              name={`crc.${key}`}
              label={formCloseConfig.CRC.labels[key]}
              placeholder={formT?.placeholders?.amount}
              value={formik.values.crc[key as keyof typeof formik.values.crc]}
              onChange={formik.handleChange}
              error={Boolean(
                formik.touched.crc?.[key as keyof typeof formik.touched.crc] &&
                formik.errors.crc?.[key as keyof typeof formik.errors.crc]
              )}
              color={
                Boolean(
                  formik.touched.crc?.[key as keyof typeof formik.touched.crc] &&
                  formik.errors.crc?.[key as keyof typeof formik.errors.crc]
                )
                  ? 'error'
                  : 'primary'
              }
              helperText={
                formik.touched.crc?.[key as keyof typeof formik.touched.crc] &&
                (formik.errors.crc?.[key as keyof typeof formik.errors.crc] as string)
              }
              disabled={formik.isSubmitting || isLoading}
            />
          </Grid>
        ))}
      </Grid>

      {/* USD Section */}
      <Divider textAlign="left" sx={{ my: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
        <Typography variant="h5">{labelsT?.currency?.USD}</Typography>
      </Divider>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6" component="div" className="font-bold">
            {textT?.cashBalance}: {formatMoney(lines['USD']?.cash_balance || 0, `${currencies.USD.symbol} `)}
            {' | '}
            {textT?.total}:{' '}
            {formatMoney(
              getFormCloseTotal(formCloseConfig.USD.amounts, formik.values.usd),
              `${currencies.USD.symbol} `
            )}
          </Typography>
        </Grid>
        {Object.keys(formCloseConfig.USD.initialValues).map((key, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={i}>
            <TextField
              fullWidth
              required
              type="number"
              id={`usd.${key}`}
              name={`usd.${key}`}
              label={formCloseConfig.USD.labels[key]}
              placeholder={formT?.placeholders?.amount}
              value={formik.values.usd[key as keyof typeof formik.values.usd]}
              onChange={formik.handleChange}
              error={Boolean(
                formik.touched.usd?.[key as keyof typeof formik.touched.usd] &&
                formik.errors.usd?.[key as keyof typeof formik.errors.usd]
              )}
              color={
                Boolean(
                  formik.touched.usd?.[key as keyof typeof formik.touched.usd] &&
                  formik.errors.usd?.[key as keyof typeof formik.errors.usd]
                )
                  ? 'error'
                  : 'primary'
              }
              helperText={
                formik.touched.usd?.[key as keyof typeof formik.touched.usd] &&
                (formik.errors.usd?.[key as keyof typeof formik.errors.usd] as string)
              }
              disabled={formik.isSubmitting || isLoading}
            />
          </Grid>
        ))}
      </Grid>

      {/* Comments, Confirmation and Submit */}
      <Divider textAlign="left" sx={{ my: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
        <Typography variant="h5">{textT?.confirmation}</Typography>
      </Divider>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, md: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                type="text"
                id="comment"
                name="comment"
                label={formT?.labels?.comment}
                placeholder={formT?.placeholders?.comment}
                value={formik.values.comment}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.comment && formik.errors.comment)}
                color={Boolean(formik.touched.comment && formik.errors.comment) ? 'error' : 'primary'}
                helperText={formik.touched.comment && (formik.errors.comment as string)}
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
                disabled={formik.isSubmitting || isLoading || !canClose}
                fullWidth>
                {textT?.btnClose}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
};

export default CashToClose;
