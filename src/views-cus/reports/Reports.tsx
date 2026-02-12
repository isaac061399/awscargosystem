'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import { Alert, Button, Card, CardContent, CardHeader, Divider, Grid, Typography } from '@mui/material';

// Others Imports
import moment from 'moment';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import Select from '@/components/Select';
import DateRangeField from '@/components/DateRangeField';
import DateField from '@/components/DateField';

import { useConfig } from '@/components/ConfigProvider';

const defaultAlertState = { open: false, type: 'success', message: '' };

const filtersConfig = {
  packagesReady: { start: true, end: false, office_id: true },
  ordersReady: { start: true, end: false, office_id: true },
  cashRegisterMovement: { start: true, end: true, office_id: true },
  packageCuts: { start: false, end: false, office_id: false }
} as const satisfies Record<string, { start: boolean; end: boolean; office_id: boolean }>;

const Reports = () => {
  const { offices } = useConfig();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('reports:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('reports:form', { returnObjects: true, default: {} }), [t]);
  const reportTypesT: any = useMemo(() => t('reports:reportTypes', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        type: '',
        office_id: '',
        start_date: null,
        end_date: null
      }),
      []
    ),
    validationSchema: yup.object({
      type: yup.string().required(formT?.errors?.type)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      const searchParams = new URLSearchParams();

      searchParams.append('t', values.type);

      if (values.office_id) {
        searchParams.append('oi', values.office_id);
      }

      if (values.start_date) {
        searchParams.append('sd', moment(values.start_date).format('YYYY-MM-DD'));
      }

      if (values.end_date) {
        searchParams.append('ed', moment(values.end_date).format('YYYY-MM-DD'));
      }

      const reportUrl = `/api/reports?${searchParams.toString()}`;

      window.open(reportUrl, '_blank');

      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const resetDates = () => {
    formik.setFieldValue('start_date', null);
    formik.setFieldValue('end_date', null);
    formik.setFieldValue('office_id', '');
  };

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
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting}
                  startIcon={<i className="ri-download-2-fill" />}>
                  {textT?.btnDownload}
                </Button>
              </div>
            </div>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card>
              {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}
              <CardContent>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Select
                      options={Object.keys(reportTypesT).map((value) => ({
                        value,
                        label: reportTypesT[value]
                      }))}
                      fullWidth
                      required
                      id="type"
                      name="type"
                      label={formT?.labels?.type}
                      placeholder={formT?.placeholders?.type}
                      value={formik.values.type}
                      onChange={(event) => {
                        formik.setFieldValue('type', event.target.value);
                        resetDates();
                      }}
                      error={Boolean(formik.touched.type && formik.errors.type)}
                      color={Boolean(formik.touched.type && formik.errors.type) ? 'error' : 'primary'}
                      helperText={formik.touched.type && formik.errors.type}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                </Grid>

                <Divider textAlign="left" sx={{ my: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h5">{textT?.filters}</Typography>
                </Divider>

                <Grid container spacing={5}>
                  {(filtersConfig[formik.values.type as keyof typeof filtersConfig]?.office_id ?? false) && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Select
                        options={offices.map((office) => ({ value: office.id, label: office.name }))}
                        fullWidth
                        id="office_id"
                        name="office_id"
                        label={formT?.labels?.office_id}
                        placeholder={formT?.placeholders?.office_id}
                        value={formik.values.office_id}
                        onChange={formik.handleChange}
                        error={Boolean(formik.touched.office_id && formik.errors.office_id)}
                        color={Boolean(formik.touched.office_id && formik.errors.office_id) ? 'error' : 'primary'}
                        helperText={formik.touched.office_id && (formik.errors.office_id as string)}
                        disabled={formik.isSubmitting}
                      />
                    </Grid>
                  )}
                  {(filtersConfig[formik.values.type as keyof typeof filtersConfig]?.start ?? false) &&
                    (filtersConfig[formik.values.type as keyof typeof filtersConfig]?.end ?? false) && (
                      <Grid size={{ xs: 12, md: 8 }}>
                        <DateRangeField
                          locale={i18n.language}
                          startDateProps={{
                            name: 'start_date',
                            label: formT?.labels?.start_date,
                            defaultValue: formik.values.start_date,
                            onChange: (value) => formik.setFieldValue('start_date', value),
                            slotProps: {
                              textField: {
                                fullWidth: true,
                                error: Boolean(formik.touched.start_date && formik.errors.start_date),
                                color: Boolean(formik.touched.start_date && formik.errors.start_date)
                                  ? 'error'
                                  : 'primary',
                                helperText: formik.touched.start_date && String(formik.errors.start_date || ''),
                                disabled: formik.isSubmitting
                              }
                            }
                          }}
                          endDateProps={{
                            name: 'end_date',
                            label: formT?.labels?.end_date,
                            defaultValue: formik.values.end_date,
                            onChange: (value) => formik.setFieldValue('end_date', value),
                            slotProps: {
                              textField: {
                                fullWidth: true,
                                error: Boolean(formik.touched.end_date && formik.errors.end_date),
                                color: Boolean(formik.touched.end_date && formik.errors.end_date) ? 'error' : 'primary',
                                helperText: formik.touched.end_date && String(formik.errors.end_date || ''),
                                disabled: formik.isSubmitting
                              }
                            }
                          }}
                        />
                      </Grid>
                    )}
                  {(filtersConfig[formik.values.type as keyof typeof filtersConfig]?.start ?? false) &&
                    !(filtersConfig[formik.values.type as keyof typeof filtersConfig]?.end ?? false) && (
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DateField
                          locale={i18n.language}
                          name="start_date"
                          label={formT?.labels?.start_date}
                          defaultValue={formik.values.start_date}
                          onChange={(value) => formik.setFieldValue('start_date', value)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: Boolean(formik.touched.start_date && formik.errors.start_date),
                              color: Boolean(formik.touched.start_date && formik.errors.start_date)
                                ? 'error'
                                : 'primary',
                              helperText: formik.touched.start_date && (formik.errors.start_date as unknown as string),
                              disabled: formik.isSubmitting
                            }
                          }}
                        />
                      </Grid>
                    )}
                  {!(filtersConfig[formik.values.type as keyof typeof filtersConfig]?.start ?? false) &&
                    (filtersConfig[formik.values.type as keyof typeof filtersConfig]?.end ?? false) && (
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DateField
                          locale={i18n.language}
                          name="end_date"
                          label={formT?.labels?.end_date}
                          defaultValue={formik.values.end_date}
                          onChange={(value) => formik.setFieldValue('end_date', value)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: Boolean(formik.touched.end_date && formik.errors.end_date),
                              color: Boolean(formik.touched.end_date && formik.errors.end_date) ? 'error' : 'primary',
                              helperText: formik.touched.end_date && (formik.errors.end_date as unknown as string),
                              disabled: formik.isSubmitting
                            }
                          }}
                        />
                      </Grid>
                    )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </DashboardLayout>
  );
};

export default Reports;
