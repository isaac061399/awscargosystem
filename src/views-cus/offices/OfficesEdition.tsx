'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { MuiChipsInput } from 'mui-chips-input';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';

// Helpers Imports
import { requestEditOffice, requestNewOffice } from '@helpers/request';

const defaultAlertState = { open: false, type: 'success', message: '' };

const OfficesEdition = ({ office }: { office?: any }) => {
  const router = useRouter();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('offices-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('offices-edition:form', { returnObjects: true, default: {} }), [t]);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        name: office ? office.name : '',
        mailbox_prefix: office ? office.mailbox_prefix : '',
        shelves: office ? `${office.shelves}`.split(',') : [],
        rows: office ? `${office.rows}`.split(',') : [],
        billing_number: office ? office.billing_number : '',
        billing_terminal: office ? office.billing_terminal : '',
        enabled: office ? office.enabled : true
      }),
      [office]
    ),
    validationSchema: yup.object({
      name: yup.string().required(formT?.errors?.name),
      mailbox_prefix: yup.string().required(formT?.errors?.mailbox_prefix),
      shelves: yup.array().min(1, formT?.errors?.shelves).required(formT?.errors?.shelves),
      rows: yup.array().min(1, formT?.errors?.rows).required(formT?.errors?.rows),
      billing_number: yup.number().integer(formT?.errors?.invalidInteger).required(formT?.errors?.billing_number),
      billing_terminal: yup.number().integer(formT?.errors?.invalidInteger).required(formT?.errors?.billing_terminal),
      enabled: yup.boolean()
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      const newValues = {
        ...values,
        shelves: values.shelves.map((s: string) => s.trim()).join(','),
        rows: values.rows.map((r: string) => r.trim()).join(',')
      };

      try {
        const result = office
          ? await requestEditOffice(office.id, newValues, i18n.language)
          : await requestNewOffice(newValues, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        if (!office) {
          setIsRedirecting(true);
          setTimeout(() => {
            router.push(`/offices/edit/${result.id}`);
          }, 2000);
        } else {
          setTimeout(() => {
            setAlertState({ ...defaultAlertState });
          }, 5000);
        }
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
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/offices">
                  <i className="ri-arrow-left-s-line text-4xl" />
                </IconButton>
                {office ? `${textT?.titleEdit} ${formik.values.name}` : textT?.titleNew}
              </Typography>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting || isRedirecting}
                  startIcon={<i className="ri-save-line" />}>
                  {textT?.btnSave}
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
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="name"
                      name="name"
                      label={formT?.labels?.name}
                      placeholder={formT?.placeholders?.name}
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.name && formik.errors.name)}
                      color={Boolean(formik.touched.name && formik.errors.name) ? 'error' : 'primary'}
                      helperText={formik.touched.name && (formik.errors.name as string)}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="mailbox_prefix"
                      name="mailbox_prefix"
                      label={formT?.labels?.mailbox_prefix}
                      placeholder={formT?.placeholders?.mailbox_prefix}
                      value={formik.values.mailbox_prefix}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.mailbox_prefix && formik.errors.mailbox_prefix)}
                      color={
                        Boolean(formik.touched.mailbox_prefix && formik.errors.mailbox_prefix) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.mailbox_prefix && (formik.errors.mailbox_prefix as string)}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }} className="flex items-center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.enabled}
                          onChange={(e) => {
                            formik.setFieldValue('enabled', e.target.checked);
                          }}
                        />
                      }
                      label={formT?.labels?.enabled}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardContent>
                <Divider textAlign="left" sx={{ mb: 5, mt: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h4">{textT?.locationsTitle}</Typography>
                </Divider>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <MuiChipsInput
                      fullWidth
                      id="shelves"
                      name="shelves"
                      label={formT?.labels?.shelves}
                      placeholder={formT?.placeholders?.shelves}
                      value={formik.values.shelves}
                      onChange={(value) => formik.setFieldValue('shelves', value)}
                      error={Boolean(formik.touched.shelves && formik.errors.shelves)}
                      color={Boolean(formik.touched.shelves && formik.errors.shelves) ? 'error' : 'primary'}
                      helperText={formik.touched.shelves && formik.errors.shelves}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <MuiChipsInput
                      fullWidth
                      id="rows"
                      name="rows"
                      label={formT?.labels?.rows}
                      placeholder={formT?.placeholders?.rows}
                      value={formik.values.rows}
                      onChange={(value) => formik.setFieldValue('rows', value)}
                      error={Boolean(formik.touched.rows && formik.errors.rows)}
                      color={Boolean(formik.touched.rows && formik.errors.rows) ? 'error' : 'primary'}
                      helperText={formik.touched.rows && formik.errors.rows}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardContent>
                <Divider textAlign="left" sx={{ mb: 5, mt: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                  <Typography variant="h4">{textT?.billingTitle}</Typography>
                </Divider>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      id="billing_number"
                      name="billing_number"
                      label={formT?.labels?.billing_number}
                      placeholder={formT?.placeholders?.billing_number}
                      value={formik.values.billing_number}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.billing_number && formik.errors.billing_number)}
                      color={
                        Boolean(formik.touched.billing_number && formik.errors.billing_number) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.billing_number && (formik.errors.billing_number as string)}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      id="billing_terminal"
                      name="billing_terminal"
                      label={formT?.labels?.billing_terminal}
                      placeholder={formT?.placeholders?.billing_terminal}
                      value={formik.values.billing_terminal}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.billing_terminal && formik.errors.billing_terminal)}
                      color={
                        Boolean(formik.touched.billing_terminal && formik.errors.billing_terminal) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.billing_terminal && (formik.errors.billing_terminal as string)}
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

export default OfficesEdition;
