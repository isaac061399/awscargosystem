'use client';

// React Imports
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import { Alert, Button, Card, CardContent, Grid, TextField } from '@mui/material';

// Helpers Imports
import { requestEditProfile } from '@helpers/request';
import { useAdmin } from '@components/AdminProvider';

const defaultAlertState = { open: false, type: 'success', message: '' };

const Account = () => {
  const { data: admin } = useAdmin();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('profile:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('profile:tabs.account.form', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        first_name: `${admin.first_name}`,
        last_name: `${admin.last_name}`
      }),
      [admin]
    ),
    validationSchema: yup.object({
      first_name: yup.string().required(formT?.errors?.first_name),
      last_name: yup.string().required(formT?.errors?.last_name)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const data = {
          first_name: values.first_name,
          last_name: values.last_name
        };

        const result = await requestEditProfile(data, i18n.language);

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
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <form noValidate onSubmit={formik.handleSubmit}>
              <Grid container spacing={5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    autoFocus
                    fullWidth
                    required
                    type="text"
                    id="first_name"
                    name="first_name"
                    label={formT?.labels?.first_name}
                    placeholder={formT?.placeholders?.first_name}
                    value={formik.values.first_name}
                    onChange={formik.handleChange}
                    error={Boolean(formik.touched.first_name && formik.errors.first_name)}
                    color={Boolean(formik.touched.first_name && formik.errors.first_name) ? 'error' : 'primary'}
                    helperText={formik.touched.first_name && formik.errors.first_name}
                    disabled={formik.isSubmitting}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    type="text"
                    id="last_name"
                    name="last_name"
                    label={formT?.labels?.last_name}
                    placeholder={formT?.placeholders?.last_name}
                    value={formik.values.last_name}
                    onChange={formik.handleChange}
                    error={Boolean(formik.touched.last_name && formik.errors.last_name)}
                    color={Boolean(formik.touched.last_name && formik.errors.last_name) ? 'error' : 'primary'}
                    helperText={formik.touched.last_name && formik.errors.last_name}
                    disabled={formik.isSubmitting}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="email"
                    id="email"
                    name="email"
                    label={formT?.labels?.email}
                    placeholder={formT?.placeholders?.email}
                    value={admin.email}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="text"
                    id="role"
                    name="role"
                    label={formT?.labels?.role}
                    placeholder={formT?.placeholders?.role}
                    value={admin.role}
                    disabled
                  />
                </Grid>
                {alertState.open && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity={alertState.type}>{alertState.message}</Alert>
                  </Grid>
                )}
                <Grid size={{ xs: 12 }} className="flex gap-4 flex-wrap">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    loading={formik.isSubmitting}
                    startIcon={<i className="ri-save-line" />}>
                    {textT?.btnSave}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Account;
