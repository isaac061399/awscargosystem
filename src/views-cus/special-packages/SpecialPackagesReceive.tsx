'use client';

// React Imports
import { useMemo, useRef, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
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

// Helpers Imports
import { requestGetSpecialPackagesByTracking, requestReceiveSpecialPackage } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';
import { SpecialPackageType } from '@/prisma/generated/enums';

const defaultAlertState = { open: false, type: 'success', message: '' };

const SpecialPackagesReceive = () => {
  const { data: admin } = useAdmin();
  const isAdmin = hasAllPermissions('special-packages.admin', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('special-packages-receive:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('special-packages-receive:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFields, setShowFields] = useState(false);
  const [preAlertedPackage, setPreAlertedPackage] = useState<any>(null);

  const trackingFieldRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        id: null as any,
        owner: null as any,
        tracking: '',
        mailbox: ''
      }),
      []
    ),
    validationSchema: yup.object({
      owner: isAdmin ? yup.object().required(formT?.errors?.owner) : yup.object().nullable().notRequired(),
      tracking: yup.string().required(formT?.errors?.tracking),
      mailbox: yup.string().required(formT?.errors?.mailbox)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const newValues = { ...values, owner_id: values.owner?.id || null };
        delete newValues.owner;

        const result = await requestReceiveSpecialPackage(newValues, i18n.language);
        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        resetProcess();
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
        clearFields();
      } else {
        setPreAlertedPackage(data);

        formik.setFieldValue('id', data?.id || null);
        formik.setFieldValue('owner', data?.owner || null);
        formik.setFieldValue('mailbox', data?.mailbox || '');
      }

      setShowFields(true);
    };

    if (formik.values.tracking && formik.values.tracking.length > 0) {
      fetchTrackingInfo(formik.values.tracking);
    } else {
      resetProcess();
    }
  };

  const clearFields = (clearTracking?: boolean) => {
    formik.setValues({
      ...formik.values,
      id: null,
      owner: null,
      tracking: clearTracking ? '' : formik.values.tracking,
      mailbox: ''
    });
  };

  const resetProcess = () => {
    clearFields(true);
    setShowFields(false);
    setPreAlertedPackage(null);

    setTimeout(() => {
      trackingFieldRef.current?.focus();
    }, 100);
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
                  loading={formik.isSubmitting}
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
                      inputRef={trackingFieldRef}
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
                      disabled={formik.isSubmitting}
                      slotProps={{
                        input: {
                          readOnly: isLoading,
                          endAdornment: isLoading ? (
                            <i className="ri-loader-4-line animate-spin" />
                          ) : (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={() => onTrackingSearch()}
                                disabled={formik.isSubmitting || isLoading}>
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
                      <Grid size={{ xs: 12, md: 6 }}>
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
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }} />
                    </>
                  )}

                  {showFields && (
                    <>
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
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 8 }} sx={{ display: { xs: 'none', md: 'block' } }} />
                    </>
                  )}

                  {preAlertedPackage && (
                    <Grid size={{ xs: 12 }}>
                      <Card
                        className={`border-l-4 ${preAlertedPackage.type === SpecialPackageType.URGENT ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}`}
                        elevation={0}>
                        <Box className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <i
                              className={`ri-alert-line ${preAlertedPackage.type === SpecialPackageType.URGENT ? 'text-red-600' : 'text-blue-600'}`}
                            />
                            <Typography variant="subtitle1" className="font-semibold">
                              {textT?.preAlertedTitle}
                            </Typography>
                            <Chip
                              size="small"
                              color={preAlertedPackage.type === SpecialPackageType.URGENT ? 'error' : 'primary'}
                              label={labelsT?.specialPackageType?.[preAlertedPackage.type] || preAlertedPackage.type}
                            />
                          </div>

                          {preAlertedPackage.indications ? (
                            <Typography variant="body1" className="text-slate-700">
                              {preAlertedPackage.indications}
                            </Typography>
                          ) : (
                            <Typography variant="body1" className="italic text-slate-500">
                              {textT?.preAlertedNoIndications}
                            </Typography>
                          )}

                          <Box className="space-y-2">
                            {preAlertedPackage.special_package_documents.map((doc: any) => (
                              <Box key={doc.id} className="flex items-center gap-1">
                                <Typography variant="body1">{doc.description}:</Typography>
                                <Link
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline">
                                  {doc.file_name}
                                </Link>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Card>
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

export default SpecialPackagesReceive;
