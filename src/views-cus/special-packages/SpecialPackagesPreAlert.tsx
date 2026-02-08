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
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import AdministratorField from '@/components/custom/AdministratorField';
import Select from '@/components/Select';

// Helpers Imports
import { requestGetSpecialPackagesByTracking, requestPreAlertSpecialPackage } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

const defaultAlertState = { open: false, type: 'success', message: '' };

const SpecialPackagesPreAlert = () => {
  const router = useRouter();

  const { data: admin } = useAdmin();
  const isAdmin = hasAllPermissions('special-packages.admin', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('special-packages-pre-alert:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('special-packages-pre-alert:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showFields, setShowFields] = useState(false);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        id: null as any,
        owner: null as any,
        tracking: '',
        mailbox: '',
        type: '',
        indications: ''
      }),
      []
    ),
    validationSchema: yup.object({
      owner: isAdmin ? yup.object().required(formT?.errors?.owner) : yup.object().nullable().notRequired(),
      tracking: yup.string().required(formT?.errors?.tracking),
      mailbox: yup.string().required(formT?.errors?.mailbox),
      type: yup.string().required(formT?.errors?.type),
      indications: yup.string().required(formT?.errors?.indications)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const newValues = { ...values, owner_id: values.owner?.id || null };
        delete newValues.owner;

        const result = await requestPreAlertSpecialPackage(newValues, i18n.language);
        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        setIsRedirecting(true);

        setTimeout(() => {
          router.push(`/special-packages`);
        }, 2000);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const onTrackingSearch = async () => {
    const fetchTrackingInfo = async (tracking: string) => {
      setIsLoading(true);

      const { valid, data } = await requestGetSpecialPackagesByTracking(tracking, i18n.language);

      setIsLoading(false);

      if (!valid) {
        handleCleanFields();
      } else {
        formik.setFieldValue('id', data?.id || null);
        formik.setFieldValue('owner', data?.owner || null);
        formik.setFieldValue('mailbox', data?.mailbox || '');
        formik.setFieldValue('type', data?.type || '');
        formik.setFieldValue('indications', data?.indications || '');
      }

      setShowFields(true);
    };

    if (formik.values.tracking && formik.values.tracking.length > 0) {
      fetchTrackingInfo(formik.values.tracking);
    } else {
      setShowFields(false);
      handleCleanFields();
    }
  };

  const handleCleanFields = () => {
    formik.setFieldValue('id', null);
    formik.setFieldValue('owner', null);
    formik.setFieldValue('mailbox', '');
    formik.setFieldValue('type', '');
    formik.setFieldValue('indications', '');
  };

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex flex-col sm:flex-row sm:justify-between justify-start items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Typography variant="h3" className="flex items-center gap-1">
                  <IconButton className="p-1" color="default" LinkComponent={Link} href="/special-packages">
                    <i className="ri-arrow-left-s-line text-4xl" />
                  </IconButton>
                  {textT?.title}
                </Typography>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting || isRedirecting || isLoading}
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
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      autoFocus
                      fullWidth
                      required
                      type="text"
                      id="tracking"
                      name="tracking"
                      label={formT?.labels?.tracking}
                      placeholder={formT?.placeholders?.tracking}
                      value={formik.values.tracking}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.tracking && formik.errors.tracking)}
                      color={Boolean(formik.touched.tracking && formik.errors.tracking) ? 'error' : 'primary'}
                      helperText={formik.touched.tracking && formik.errors.tracking}
                      disabled={formik.isSubmitting || isRedirecting || isLoading}
                      slotProps={{
                        input: {
                          endAdornment: isLoading ? (
                            <i className="ri-loader-4-line animate-spin" />
                          ) : (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={() => onTrackingSearch()}
                                disabled={formik.isSubmitting || isRedirecting || isLoading}>
                                <i className="ri-arrow-right-line"></i>
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;

                        e.preventDefault();
                        onTrackingSearch();
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }} sx={{ display: { xs: 'none', md: 'block' } }} />

                  {showFields && isAdmin && (
                    <>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <AdministratorField
                          initialOptions={[]}
                          isOptionEqualToValue={(option, v) => option.id === v.id}
                          loadingText={textT?.loading}
                          noOptionsText={textT?.noOptions}
                          value={formik.values.owner}
                          onChange={(value) => {
                            formik.setFieldValue('owner', value || null);
                          }}
                          id="owner"
                          name="owner"
                          label={formT?.labels?.owner}
                          placeholder={formT?.placeholders?.owner}
                          error={Boolean(formik.touched.owner && formik.errors.owner)}
                          color={Boolean(formik.touched.owner && formik.errors.owner) ? 'error' : 'primary'}
                          helperText={formik.touched.owner && (formik.errors.owner as string)}
                          disabled={formik.isSubmitting || isRedirecting || isLoading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }} />
                    </>
                  )}

                  {showFields && (
                    <>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Select
                          options={Object.keys(labelsT?.specialPackageType).map((value) => ({
                            value,
                            label: labelsT?.specialPackageType[value]
                          }))}
                          fullWidth
                          required
                          id="type"
                          name="type"
                          label={formT?.labels?.type}
                          placeholder={formT?.placeholders?.type}
                          value={formik.values.type}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.type && formik.errors.type)}
                          color={Boolean(formik.touched.type && formik.errors.type) ? 'error' : 'primary'}
                          helperText={formik.touched.type && (formik.errors.type as string)}
                          disabled={formik.isSubmitting || isRedirecting || isLoading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          required
                          type="text"
                          id="mailbox"
                          name="mailbox"
                          label={formT?.labels?.mailbox}
                          placeholder={formT?.placeholders?.mailbox}
                          value={formik.values.mailbox}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.mailbox && formik.errors.mailbox)}
                          color={Boolean(formik.touched.mailbox && formik.errors.mailbox) ? 'error' : 'primary'}
                          helperText={formik.touched.mailbox && formik.errors.mailbox}
                          disabled={formik.isSubmitting || isRedirecting || isLoading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }} />

                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          fullWidth
                          required
                          multiline
                          minRows={2}
                          type="text"
                          id="indications"
                          name="indications"
                          label={formT?.labels?.indications}
                          placeholder={formT?.placeholders?.indications}
                          value={formik.values.indications}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.indications && formik.errors.indications)}
                          color={Boolean(formik.touched.indications && formik.errors.indications) ? 'error' : 'primary'}
                          helperText={formik.touched.indications && formik.errors.indications}
                          disabled={formik.isSubmitting || isRedirecting || isLoading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }} />
                    </>
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

export default SpecialPackagesPreAlert;
