'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import { Alert, Button, Card, CardContent, CardHeader, Divider, Grid, TextField, Typography } from '@mui/material';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import MoneyField from '@/components/MoneyField';

// Helpers Imports
import { requestEditConfiguration } from '@/helpers/request';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

import { Currencies } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const RolesEdition = ({ configuration }: { configuration?: any }) => {
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
        additional_exchange_rate: configuration ? configuration.additional_exchange_rate : 0,
        iva_percentage: configuration ? configuration.iva_percentage : 0,
        address_line_1: configuration ? configuration.address_line_1 : '',
        address_line_2: configuration ? configuration.address_line_2 : '',
        address_city: configuration ? configuration.address_city : '',
        address_state: configuration ? configuration.address_state : '',
        address_postal_code: configuration ? configuration.address_postal_code : '',
        address_phone: configuration ? configuration.address_phone : ''
      }),
      [configuration]
    ),
    validationSchema: yup.object({
      pound_fee: yup.number().required(formT?.errors?.pound_fee),
      additional_exchange_rate: yup.number().required(formT?.errors?.additional_exchange_rate),
      iva_percentage: yup.number().required(formT?.errors?.iva_percentage),
      address_line_1: yup.string().required(formT?.errors?.address_line_1),
      address_line_2: yup.string().required(formT?.errors?.address_line_2),
      address_city: yup.string().required(formT?.errors?.address_city),
      address_state: yup.string().required(formT?.errors?.address_state),
      address_postal_code: yup.string().required(formT?.errors?.address_postal_code),
      address_phone: yup.string().required(formT?.errors?.address_phone)
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
            <Card>
              {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}
              <CardContent>
                <Divider textAlign="left" sx={{ mb: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h5">{textT?.generalTitle}</Typography>
                </Divider>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <MoneyField
                      fullWidth
                      required
                      type="text"
                      decimalScale={2}
                      decimalSeparator="."
                      thousandSeparator=","
                      prefix={`${Currencies.USD.symbol} `}
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
                  <Grid size={{ xs: 12, md: 4 }}>
                    <MoneyField
                      fullWidth
                      required
                      type="text"
                      decimalScale={2}
                      decimalSeparator="."
                      thousandSeparator=","
                      prefix={`${Currencies.CRC.symbol} `}
                      id="additional_exchange_rate"
                      name="additional_exchange_rate"
                      label={formT?.labels?.additional_exchange_rate}
                      placeholder={formT?.placeholders?.additional_exchange_rate}
                      value={formik.values.additional_exchange_rate}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.additional_exchange_rate && formik.errors.additional_exchange_rate)}
                      color={
                        Boolean(formik.touched.additional_exchange_rate && formik.errors.additional_exchange_rate)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.additional_exchange_rate && (formik.errors.additional_exchange_rate as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
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
                </Grid>
              </CardContent>
              <CardContent>
                <Divider textAlign="left" sx={{ mb: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h5">{textT?.addressTitle}</Typography>
                </Divider>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="address_line_1"
                      name="address_line_1"
                      label={formT?.labels?.address_line_1}
                      placeholder={formT?.placeholders?.address_line_1}
                      value={formik.values.address_line_1}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.address_line_1 && formik.errors.address_line_1)}
                      color={
                        Boolean(formik.touched.address_line_1 && formik.errors.address_line_1) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.address_line_1 && (formik.errors.address_line_1 as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="address_line_2"
                      name="address_line_2"
                      label={formT?.labels?.address_line_2}
                      placeholder={formT?.placeholders?.address_line_2}
                      value={formik.values.address_line_2}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.address_line_2 && formik.errors.address_line_2)}
                      color={
                        Boolean(formik.touched.address_line_2 && formik.errors.address_line_2) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.address_line_2 && (formik.errors.address_line_2 as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="address_city"
                      name="address_city"
                      label={formT?.labels?.address_city}
                      placeholder={formT?.placeholders?.address_city}
                      value={formik.values.address_city}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.address_city && formik.errors.address_city)}
                      color={Boolean(formik.touched.address_city && formik.errors.address_city) ? 'error' : 'primary'}
                      helperText={formik.touched.address_city && (formik.errors.address_city as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="address_state"
                      name="address_state"
                      label={formT?.labels?.address_state}
                      placeholder={formT?.placeholders?.address_state}
                      value={formik.values.address_state}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.address_state && formik.errors.address_state)}
                      color={Boolean(formik.touched.address_state && formik.errors.address_state) ? 'error' : 'primary'}
                      helperText={formik.touched.address_state && (formik.errors.address_state as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="address_postal_code"
                      name="address_postal_code"
                      label={formT?.labels?.address_postal_code}
                      placeholder={formT?.placeholders?.address_postal_code}
                      value={formik.values.address_postal_code}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.address_postal_code && formik.errors.address_postal_code)}
                      color={
                        Boolean(formik.touched.address_postal_code && formik.errors.address_postal_code)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={formik.touched.address_postal_code && (formik.errors.address_postal_code as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="address_phone"
                      name="address_phone"
                      label={formT?.labels?.address_phone}
                      placeholder={formT?.placeholders?.address_phone}
                      value={formik.values.address_phone}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.address_phone && formik.errors.address_phone)}
                      color={Boolean(formik.touched.address_phone && formik.errors.address_phone) ? 'error' : 'primary'}
                      helperText={formik.touched.address_phone && (formik.errors.address_phone as string)}
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

export default RolesEdition;
