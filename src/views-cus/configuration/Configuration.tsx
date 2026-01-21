'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import moment from 'moment';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import MoneyField from '@/components/MoneyField';

// Helpers Imports
import { requestEditConfiguration } from '@/helpers/request';
import { useConfig } from '@/components/ConfigProvider';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

import { currencies } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const Configuration = () => {
  const { configuration } = useConfig();
  const { data: admin } = useAdmin();
  const canEdit = hasAllPermissions('configuration.edit', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('configuration:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('configuration:form', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        pound_fee: configuration ? configuration.pound_fee : 0,
        iva_percentage: configuration ? configuration.iva_percentage : 0,
        selling_exchange_rate: configuration ? configuration.selling_exchange_rate : 0,
        buying_exchange_rate: configuration ? configuration.buying_exchange_rate : 0,

        air_address_line_1: configuration ? configuration.air_address_line_1 : '',
        air_address_line_2: configuration ? configuration.air_address_line_2 : '',
        air_address_city: configuration ? configuration.air_address_city : '',
        air_address_state: configuration ? configuration.air_address_state : '',
        air_address_postal_code: configuration ? configuration.air_address_postal_code : '',
        air_address_phone: configuration ? configuration.air_address_phone : '',

        maritime_address_line_1: configuration ? configuration.maritime_address_line_1 : '',
        maritime_address_line_2: configuration ? configuration.maritime_address_line_2 : '',
        maritime_address_city: configuration ? configuration.maritime_address_city : '',
        maritime_address_state: configuration ? configuration.maritime_address_state : '',
        maritime_address_postal_code: configuration ? configuration.maritime_address_postal_code : '',
        maritime_address_phone: configuration ? configuration.maritime_address_phone : '',

        billing_name: configuration ? configuration.billing_name : '',
        billing_identification: configuration ? configuration.billing_identification : '',
        billing_activity_code: configuration ? configuration.billing_activity_code : ''
      }),
      [configuration]
    ),
    validationSchema: yup.object({
      pound_fee: yup.number().required(formT?.errors?.pound_fee),
      iva_percentage: yup.number().required(formT?.errors?.iva_percentage),
      selling_exchange_rate: yup.number().required(formT?.errors?.selling_exchange_rate),
      buying_exchange_rate: yup.number().required(formT?.errors?.buying_exchange_rate),

      air_address_line_1: yup.string().required(formT?.errors?.air_address_line_1),
      air_address_line_2: yup.string().required(formT?.errors?.air_address_line_2),
      air_address_city: yup.string().required(formT?.errors?.air_address_city),
      air_address_state: yup.string().required(formT?.errors?.air_address_state),
      air_address_postal_code: yup.string().required(formT?.errors?.air_address_postal_code),
      air_address_phone: yup.string().required(formT?.errors?.air_address_phone),

      maritime_address_line_1: yup.string().required(formT?.errors?.maritime_address_line_1),
      maritime_address_line_2: yup.string().required(formT?.errors?.maritime_address_line_2),
      maritime_address_city: yup.string().required(formT?.errors?.maritime_address_city),
      maritime_address_state: yup.string().required(formT?.errors?.maritime_address_state),
      maritime_address_postal_code: yup.string().required(formT?.errors?.maritime_address_postal_code),
      maritime_address_phone: yup.string().required(formT?.errors?.maritime_address_phone),

      billing_name: yup.string().required(formT?.errors?.billing_name),
      billing_identification: yup.string().required(formT?.errors?.billing_identification),
      billing_activity_code: yup.string().required(formT?.errors?.billing_activity_code)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const result = await requestEditConfiguration(values, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const lastExchangeRateUpdate = moment(configuration?.updated_exchange_rate).format(textT?.dateFormat);

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <Typography variant="h3" className="flex items-center gap-1">
                {textT?.title}
              </Typography>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    size="small"
                    type="submit"
                    variant="contained"
                    color="primary"
                    loading={formik.isSubmitting}
                    startIcon={<i className="ri-save-line" />}>
                    {textT?.btnSave}
                  </Button>
                )}
              </div>
            </div>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
              <i className="ri-history-fill text-lg" />

              <Typography variant="body2" color="text.secondary">
                {textT?.lastExchangeRateUpdate}:
              </Typography>

              <Tooltip title={textT?.lastExchangeRateUpdate} arrow>
                <Chip
                  size="small"
                  label={lastExchangeRateUpdate}
                  sx={{
                    fontWeight: 600,
                    letterSpacing: 0.2,
                    borderRadius: 999,
                    bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(144,202,249,0.12)' : 'rgba(25,118,210,0.10)')
                  }}
                />
              </Tooltip>
            </Stack>

            <Card>
              {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}
              <CardContent>
                <Divider textAlign="left" sx={{ mb: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h5">{textT?.generalTitle}</Typography>
                </Divider>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <MoneyField
                      fullWidth
                      required
                      type="text"
                      decimalScale={2}
                      decimalSeparator="."
                      thousandSeparator=","
                      prefix={`${currencies.USD.symbol} `}
                      id="pound_fee"
                      name="pound_fee"
                      label={formT?.labels?.pound_fee}
                      placeholder={formT?.placeholders?.pound_fee}
                      value={formik.values.pound_fee}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.pound_fee && formik.errors.pound_fee)}
                      color={Boolean(formik.touched.pound_fee && formik.errors.pound_fee) ? 'error' : 'primary'}
                      helperText={formik.touched.pound_fee && (formik.errors.pound_fee as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      id="iva_percentage"
                      name="iva_percentage"
                      label={formT?.labels?.iva_percentage}
                      placeholder={formT?.placeholders?.iva_percentage}
                      value={formik.values.iva_percentage}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.iva_percentage && formik.errors.iva_percentage)}
                      color={
                        Boolean(formik.touched.iva_percentage && formik.errors.iva_percentage) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.iva_percentage && (formik.errors.iva_percentage as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <MoneyField
                      fullWidth
                      required
                      type="text"
                      decimalScale={2}
                      decimalSeparator="."
                      thousandSeparator=","
                      prefix={`${currencies.CRC.symbol} `}
                      id="selling_exchange_rate"
                      name="selling_exchange_rate"
                      label={formT?.labels?.selling_exchange_rate}
                      placeholder={formT?.placeholders?.selling_exchange_rate}
                      value={formik.values.selling_exchange_rate}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.selling_exchange_rate && formik.errors.selling_exchange_rate)}
                      color={
                        Boolean(formik.touched.selling_exchange_rate && formik.errors.selling_exchange_rate)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.selling_exchange_rate && (formik.errors.selling_exchange_rate as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <MoneyField
                      fullWidth
                      required
                      type="text"
                      decimalScale={2}
                      decimalSeparator="."
                      thousandSeparator=","
                      prefix={`${currencies.CRC.symbol} `}
                      id="buying_exchange_rate"
                      name="buying_exchange_rate"
                      label={formT?.labels?.buying_exchange_rate}
                      placeholder={formT?.placeholders?.buying_exchange_rate}
                      value={formik.values.buying_exchange_rate}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.buying_exchange_rate && formik.errors.buying_exchange_rate)}
                      color={
                        Boolean(formik.touched.buying_exchange_rate && formik.errors.buying_exchange_rate)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={formik.touched.buying_exchange_rate && (formik.errors.buying_exchange_rate as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardContent>
                <Divider textAlign="left" sx={{ mb: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h5">{textT?.airAddressTitle}</Typography>
                </Divider>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="air_address_line_1"
                      name="air_address_line_1"
                      label={formT?.labels?.air_address_line_1}
                      placeholder={formT?.placeholders?.air_address_line_1}
                      value={formik.values.air_address_line_1}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.air_address_line_1 && formik.errors.air_address_line_1)}
                      color={
                        Boolean(formik.touched.air_address_line_1 && formik.errors.air_address_line_1)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={formik.touched.air_address_line_1 && (formik.errors.air_address_line_1 as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="air_address_line_2"
                      name="air_address_line_2"
                      label={formT?.labels?.air_address_line_2}
                      placeholder={formT?.placeholders?.air_address_line_2}
                      value={formik.values.air_address_line_2}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.air_address_line_2 && formik.errors.air_address_line_2)}
                      color={
                        Boolean(formik.touched.air_address_line_2 && formik.errors.air_address_line_2)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={formik.touched.air_address_line_2 && (formik.errors.air_address_line_2 as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="air_address_city"
                      name="air_address_city"
                      label={formT?.labels?.air_address_city}
                      placeholder={formT?.placeholders?.air_address_city}
                      value={formik.values.air_address_city}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.air_address_city && formik.errors.air_address_city)}
                      color={
                        Boolean(formik.touched.air_address_city && formik.errors.air_address_city) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.air_address_city && (formik.errors.air_address_city as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="air_address_state"
                      name="air_address_state"
                      label={formT?.labels?.air_address_state}
                      placeholder={formT?.placeholders?.air_address_state}
                      value={formik.values.air_address_state}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.air_address_state && formik.errors.air_address_state)}
                      color={
                        Boolean(formik.touched.air_address_state && formik.errors.air_address_state)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={formik.touched.air_address_state && (formik.errors.air_address_state as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="air_address_postal_code"
                      name="air_address_postal_code"
                      label={formT?.labels?.air_address_postal_code}
                      placeholder={formT?.placeholders?.air_address_postal_code}
                      value={formik.values.air_address_postal_code}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.air_address_postal_code && formik.errors.air_address_postal_code)}
                      color={
                        Boolean(formik.touched.air_address_postal_code && formik.errors.air_address_postal_code)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.air_address_postal_code && (formik.errors.air_address_postal_code as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="air_address_phone"
                      name="air_address_phone"
                      label={formT?.labels?.air_address_phone}
                      placeholder={formT?.placeholders?.air_address_phone}
                      value={formik.values.air_address_phone}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.air_address_phone && formik.errors.air_address_phone)}
                      color={
                        Boolean(formik.touched.air_address_phone && formik.errors.air_address_phone)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={formik.touched.air_address_phone && (formik.errors.air_address_phone as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardContent>
                <Divider textAlign="left" sx={{ mb: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h5">{textT?.maritimeAddressTitle}</Typography>
                </Divider>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="maritime_address_line_1"
                      name="maritime_address_line_1"
                      label={formT?.labels?.maritime_address_line_1}
                      placeholder={formT?.placeholders?.maritime_address_line_1}
                      value={formik.values.maritime_address_line_1}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.maritime_address_line_1 && formik.errors.maritime_address_line_1)}
                      color={
                        Boolean(formik.touched.maritime_address_line_1 && formik.errors.maritime_address_line_1)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.maritime_address_line_1 && (formik.errors.maritime_address_line_1 as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="maritime_address_line_2"
                      name="maritime_address_line_2"
                      label={formT?.labels?.maritime_address_line_2}
                      placeholder={formT?.placeholders?.maritime_address_line_2}
                      value={formik.values.maritime_address_line_2}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.maritime_address_line_2 && formik.errors.maritime_address_line_2)}
                      color={
                        Boolean(formik.touched.maritime_address_line_2 && formik.errors.maritime_address_line_2)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.maritime_address_line_2 && (formik.errors.maritime_address_line_2 as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="maritime_address_city"
                      name="maritime_address_city"
                      label={formT?.labels?.maritime_address_city}
                      placeholder={formT?.placeholders?.maritime_address_city}
                      value={formik.values.maritime_address_city}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.maritime_address_city && formik.errors.maritime_address_city)}
                      color={
                        Boolean(formik.touched.maritime_address_city && formik.errors.maritime_address_city)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.maritime_address_city && (formik.errors.maritime_address_city as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="maritime_address_state"
                      name="maritime_address_state"
                      label={formT?.labels?.maritime_address_state}
                      placeholder={formT?.placeholders?.maritime_address_state}
                      value={formik.values.maritime_address_state}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.maritime_address_state && formik.errors.maritime_address_state)}
                      color={
                        Boolean(formik.touched.maritime_address_state && formik.errors.maritime_address_state)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.maritime_address_state && (formik.errors.maritime_address_state as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="maritime_address_postal_code"
                      name="maritime_address_postal_code"
                      label={formT?.labels?.maritime_address_postal_code}
                      placeholder={formT?.placeholders?.maritime_address_postal_code}
                      value={formik.values.maritime_address_postal_code}
                      onChange={formik.handleChange}
                      error={Boolean(
                        formik.touched.maritime_address_postal_code && formik.errors.maritime_address_postal_code
                      )}
                      color={
                        Boolean(
                          formik.touched.maritime_address_postal_code && formik.errors.maritime_address_postal_code
                        )
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.maritime_address_postal_code &&
                        (formik.errors.maritime_address_postal_code as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="maritime_address_phone"
                      name="maritime_address_phone"
                      label={formT?.labels?.maritime_address_phone}
                      placeholder={formT?.placeholders?.maritime_address_phone}
                      value={formik.values.maritime_address_phone}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.maritime_address_phone && formik.errors.maritime_address_phone)}
                      color={
                        Boolean(formik.touched.maritime_address_phone && formik.errors.maritime_address_phone)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.maritime_address_phone && (formik.errors.maritime_address_phone as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardContent>
                <Divider textAlign="left" sx={{ mb: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h5">{textT?.billingTitle}</Typography>
                </Divider>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="billing_name"
                      name="billing_name"
                      label={formT?.labels?.billing_name}
                      placeholder={formT?.placeholders?.billing_name}
                      value={formik.values.billing_name}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.billing_name && formik.errors.billing_name)}
                      color={Boolean(formik.touched.billing_name && formik.errors.billing_name) ? 'error' : 'primary'}
                      helperText={formik.touched.billing_name && (formik.errors.billing_name as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="billing_identification"
                      name="billing_identification"
                      label={formT?.labels?.billing_identification}
                      placeholder={formT?.placeholders?.billing_identification}
                      value={formik.values.billing_identification}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.billing_identification && formik.errors.billing_identification)}
                      color={
                        Boolean(formik.touched.billing_identification && formik.errors.billing_identification)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.billing_identification && (formik.errors.billing_identification as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="billing_activity_code"
                      name="billing_activity_code"
                      label={formT?.labels?.billing_activity_code}
                      placeholder={formT?.placeholders?.billing_activity_code}
                      value={formik.values.billing_activity_code}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.billing_activity_code && formik.errors.billing_activity_code)}
                      color={
                        Boolean(formik.touched.billing_activity_code && formik.errors.billing_activity_code)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.billing_activity_code && (formik.errors.billing_activity_code as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </DashboardLayout>
  );
};

export default Configuration;
