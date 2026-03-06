'use client';

// React Imports
import { useEffect, useMemo, useRef, useState } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Radio,
  Stack,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import Select from '@/components/Select';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

// Helpers Imports
import {
  requestNewUnownedPackage,
  requestPackagesReception,
  requestPackagesReceptionClient,
  requestPackagesReceptionTracking
} from '@/helpers/request';
import { currencies } from '@/libs/constants';
import { formatMoney, padStartZeros } from '@/libs/utils';
import { calculateShippingPrice } from '@/helpers/calculations';
import { useConfig } from '@/components/ConfigProvider';

const defaultAlertState = { open: false, type: 'success', message: '' };

const PackageReception = () => {
  const { offices } = useConfig();
  const { data: admin } = useAdmin();
  const canCreateUnownedPackages = hasAllPermissions('unowned-packages.create', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('packages-reception:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('packages-reception:form', { returnObjects: true, default: {} }), [t]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [errorAlert, setErrorAlert] = useState<any>({ open: false, inputRef: null, message: '' });
  const [trackingHasChanged, setTrackingHasChanged] = useState<boolean>(false);
  const [showClientFields, setShowClientFields] = useState<boolean>(false);
  const [showAllOtherFields, setShowAllOtherFields] = useState<boolean>(false);
  const [blockWeightField, setBlockWeightField] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(0);
  const [unownedPackageState, setUnownedPackageState] = useState({
    open: false,
    loading: false,
    description: '',
    descriptionError: ''
  });
  const [selectorState, setSelectorState] = useState({
    open: false,
    items: { orders: [], packages: [] },
    selected: { package_id: '', order_id: '', client: null, weight: undefined as any }
  });

  const lastFieldRef = useRef<HTMLInputElement>(null);

  const cutFieldRef = useRef<HTMLInputElement>(null);
  const trackingFieldRef = useRef<HTMLInputElement>(null);
  const mailboxFieldRef = useRef<HTMLInputElement>(null);
  const weightFieldRef = useRef<HTMLInputElement>(null);
  const shelfFieldRef = useRef<HTMLInputElement>(null);
  const rowFieldRef = useRef<HTMLInputElement>(null);

  const trackingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const weightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        office_id: offices[0]?.id || '',
        cut_number: '',
        tracking: '',
        package_id: '',
        order_id: '',
        mailbox: '',
        client: null as any,
        weight: '',
        shelf: '',
        row: ''
      }),
      [offices]
    ),
    validationSchema: yup.object({
      cut_number: yup.string().required(formT?.errors?.cut_number),
      tracking: yup.string().required(formT?.errors?.tracking),
      weight: yup.number().required(formT?.errors?.weight),
      client: yup.object().required(formT?.errors?.client)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const newValues = {
          office_id: values.office_id,
          cut_number: values.cut_number,
          tracking: values.tracking,
          package_id: values.package_id,
          order_id: values.order_id,
          client_id: values.client.id,
          weight: !blockWeightField ? values.weight : undefined,
          shelf: values.shelf,
          row: values.row
        };

        const result = await requestPackagesReception(newValues, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        window.open(`/print/sticker/${result.tracking}`, '_blank');

        resetProcess();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  // cut field auto focus on load
  useEffect(() => {
    setTimeout(() => {
      cutFieldRef.current?.focus();
      lastFieldRef.current = cutFieldRef.current;
    }, 0);
  }, []);

  // focus mailbox field when showClientFields is true
  useEffect(() => {
    if (showClientFields) {
      setTimeout(() => {
        mailboxFieldRef.current?.focus();
        lastFieldRef.current = mailboxFieldRef.current;
      }, 0);
    }
  }, [showClientFields]);

  // focus weight field when showAllOtherFields is true
  useEffect(() => {
    if (showAllOtherFields) {
      setTimeout(() => {
        if (blockWeightField) {
          shelfFieldRef.current?.focus();
          lastFieldRef.current = shelfFieldRef.current;
        } else {
          weightFieldRef.current?.focus();
          lastFieldRef.current = weightFieldRef.current;
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllOtherFields]);

  // tracking field change effect
  useEffect(() => {
    const fetchTrackingInfo = async (tracking: string) => {
      setIsLoading(true);

      const result = await requestPackagesReceptionTracking(tracking, i18n.language);

      setIsLoading(false);

      if (!result.valid) {
        setErrorAlert({ open: true, inputRef: trackingFieldRef, message: textT?.trackingAlertMessage });

        return;
      }

      const { packages, orders } = result;
      if (packages.length === 0 && orders.length === 0) {
        // set data not found
        setNoTrackingItem();

        return;
      }

      if (packages.length + orders.length > 1) {
        // show selector dialog
        setSelectorState({
          ...selectorState,
          open: true,
          items: { packages, orders },
          selected: { package_id: '', order_id: '', client: null, weight: undefined }
        });
      } else {
        // set the found item
        if (packages[0]) {
          const weight =
            packages[0].billing_weight && !isNaN(packages[0].billing_weight) ? packages[0].billing_weight : undefined;
          setTrackingItem('package', packages[0].id, packages[0].client, weight);
        } else if (orders[0]) {
          const weight =
            orders[0].packages && orders[0].packages[0] && !isNaN(orders[0].packages[0].billing_weight)
              ? orders[0].packages[0].billing_weight
              : undefined;
          setTrackingItem('order', orders[0].id, orders[0].client, weight);
        }
      }
    };

    if (formik.values.tracking && formik.values.tracking.length > 0) {
      setTrackingHasChanged(true);

      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }

      trackingTimeoutRef.current = setTimeout(() => {
        fetchTrackingInfo(formik.values.tracking);
      }, 500);
    } else {
      if (trackingHasChanged) {
        resetProcess();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.tracking]);

  // validate same office for client
  useEffect(() => {
    if (formik.values.client) {
      if (formik.values.client.office.id !== formik.values.office_id) {
        setErrorAlert({
          open: true,
          message: textT?.officeAlertMessage?.replace('{{ office }}', formik.values.client?.office?.name || '')
        });
      } else {
        setTimeout(() => {
          weightFieldRef.current?.focus();
          lastFieldRef.current = weightFieldRef.current;
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.client]);

  // weight field change effect
  useEffect(() => {
    if (formik.values.weight && formik.values.weight.toString().length > 0) {
      if (weightTimeoutRef.current) {
        clearTimeout(weightTimeoutRef.current);
      }

      weightTimeoutRef.current = setTimeout(() => {
        const amount = calculateShippingPrice(formik.values.weight, formik.values.client?.pound_fee || 0);

        setPrice(amount);
      }, 500);
    } else {
      setPrice(0);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.weight]);

  const setTrackingItem = (type: 'package' | 'order', id: string, client: any, weight?: number) => {
    if (type === 'package') {
      formik.setFieldValue('package_id', id);
      formik.setFieldValue('order_id', '');
    } else if (type === 'order') {
      formik.setFieldValue('order_id', id);
      formik.setFieldValue('package_id', '');
    }

    formik.setFieldValue('mailbox', '');
    formik.setFieldValue('client', client);

    if (weight) {
      formik.setFieldValue('weight', weight);
      setBlockWeightField(true);
    } else {
      formik.setFieldValue('weight', '');
      setBlockWeightField(false);
    }

    // show the rest of the fields
    setShowClientFields(true);
    setShowAllOtherFields(true);
  };

  const setNoTrackingItem = () => {
    // clear package_id, order_id, client and weight fields
    formik.setFieldValue('package_id', '');
    formik.setFieldValue('order_id', '');
    formik.setFieldValue('mailbox', '');
    formik.setFieldValue('client', null);
    formik.setFieldValue('weight', '');

    // unblock weight field
    setBlockWeightField(false);

    // show the client fields and focus mailbox field
    setShowClientFields(true);
    setTimeout(() => {
      mailboxFieldRef.current?.focus();
      lastFieldRef.current = mailboxFieldRef.current;
    }, 100);

    // hide the rest of the fields
    setShowAllOtherFields(false);
  };

  const resetProcess = () => {
    formik.setValues({
      ...formik.values,
      tracking: '',
      package_id: '',
      order_id: '',
      mailbox: '',
      client: null,
      weight: ''
    });

    setShowClientFields(false);
    setShowAllOtherFields(false);
    setPrice(0);
    setSelectorState({
      open: false,
      items: { orders: [], packages: [] },
      selected: { package_id: '', order_id: '', client: null, weight: undefined }
    });

    setTimeout(() => {
      trackingFieldRef.current?.focus();
      lastFieldRef.current = trackingFieldRef.current;
    }, 100);
  };

  const handleUnownedPackageOpen = () => {
    setUnownedPackageState({ open: true, loading: false, description: '', descriptionError: '' });
  };

  const handleUnownedPackageClose = () => {
    setUnownedPackageState({ open: false, loading: false, description: '', descriptionError: '' });
  };

  const handleUnownedPackage = async () => {
    if (unownedPackageState.description.trim() === '') {
      setUnownedPackageState({ ...unownedPackageState, descriptionError: textT?.unownedDialog?.descriptionError });

      return;
    }

    setUnownedPackageState({ ...unownedPackageState, loading: true });

    // save unowned package
    const result = await requestNewUnownedPackage(
      {
        office_id: formik.values.office_id,
        tracking: formik.values.tracking,
        description: unownedPackageState.description.trim()
      },
      i18n.language
    );

    if (!result.valid) {
      setUnownedPackageState({
        ...unownedPackageState,
        loading: false,
        descriptionError: result.message
      });

      return;
    }

    handleUnownedPackageClose();
    resetProcess();
  };

  // events
  const onMailboxSearch = () => {
    const fetchClientInfo = async (mailbox: string) => {
      setIsLoading(true);

      const result = await requestPackagesReceptionClient(mailbox, i18n.language);

      setIsLoading(false);

      if (!result.valid || !result.client) {
        setErrorAlert({ open: true, inputRef: mailboxFieldRef, message: textT?.clientAlertMessage });

        return;
      }

      formik.setFieldValue('client', result.client);

      setShowAllOtherFields(true);
    };

    if (formik.values.mailbox && formik.values.mailbox.length > 0) {
      fetchClientInfo(formik.values.mailbox);
    }
  };

  const onAlertClose = () => {
    if (lastFieldRef && lastFieldRef.current) {
      const inputElement = lastFieldRef.current as HTMLInputElement;
      setTimeout(() => {
        inputElement.focus();
      }, 500);
    } else if (trackingFieldRef && trackingFieldRef.current) {
      const inputElement = trackingFieldRef.current as HTMLInputElement;
      lastFieldRef.current = inputElement;
      setTimeout(() => {
        inputElement.focus();
      }, 500);
    }

    setErrorAlert({ ...errorAlert, open: false });
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
              <div className="flex items-center gap-2"></div>
            </div>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card>
              {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}
              <CardContent>
                {/* Office and Cut Number Fields */}
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 3 }}>
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
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      inputRef={cutFieldRef}
                      fullWidth
                      required
                      type="text"
                      id="cut_number"
                      name="cut_number"
                      label={formT?.labels?.cut_number}
                      placeholder={formT?.placeholders?.cut_number}
                      value={formik.values.cut_number}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.cut_number && formik.errors.cut_number)}
                      color={Boolean(formik.touched.cut_number && formik.errors.cut_number) ? 'error' : 'primary'}
                      helperText={formik.touched.cut_number && (formik.errors.cut_number as string)}
                      disabled={formik.isSubmitting || isLoading}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;

                        e.preventDefault();
                        trackingFieldRef.current?.focus();
                        lastFieldRef.current = trackingFieldRef.current;
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider className="my-5" />

                {/* Tracking Field */}
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      inputRef={trackingFieldRef}
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
                      helperText={formik.touched.tracking && (formik.errors.tracking as string)}
                      disabled={formik.isSubmitting || isLoading}
                      slotProps={{
                        input: {
                          endAdornment: isLoading ? <i className="ri-loader-4-line animate-spin" /> : null
                        }
                      }}
                    />
                  </Grid>
                  {showClientFields && (
                    <Grid size={{ xs: 12, md: 3 }} className="flex flex-col gap-1 justify-center">
                      <Typography variant="body1" fontWeight={600} gutterBottom>
                        {formik.values.order_id !== '' &&
                          `${textT?.orderLabel} #${padStartZeros(formik.values.order_id, 4)}`}
                        {formik.values.package_id !== '' && textT?.packageLabel}
                        {formik.values.order_id === '' && formik.values.package_id === '' && textT?.newPackageLabel}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Mailbox Field and Client Card */}
                {showClientFields && (
                  <>
                    <Divider textAlign="left" sx={{ my: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{textT?.clientTitle}</Typography>
                    </Divider>
                    <Grid container spacing={5}>
                      {formik.values.package_id === '' && formik.values.order_id === '' && (
                        <>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              inputRef={mailboxFieldRef}
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
                              helperText={formik.touched.mailbox && (formik.errors.mailbox as string)}
                              disabled={formik.isSubmitting || isLoading}
                              slotProps={{
                                input: {
                                  endAdornment: isLoading ? (
                                    <i className="ri-loader-4-line animate-spin" />
                                  ) : (
                                    <InputAdornment position="end">
                                      <IconButton edge="end" type="button" onClick={onMailboxSearch}>
                                        <i className="ri-arrow-right-line"></i>
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key !== 'Enter') return;

                                e.preventDefault();
                                onMailboxSearch();
                              }}
                            />
                          </Grid>
                          {canCreateUnownedPackages && (
                            <Grid size={{ xs: 12, md: 3 }} className="flex items-center">
                              <Button variant="text" color="primary" onClick={handleUnownedPackageOpen}>
                                {textT?.btnUnowned}
                              </Button>
                            </Grid>
                          )}
                        </>
                      )}
                      <Grid size={{ xs: 12 }}>
                        <Card variant="outlined">
                          <CardContent>
                            {/* Header */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="h6">{textT?.clientCard?.title}</Typography>

                              {formik.values.client && (
                                <Chip
                                  label={`${textT?.clientCard?.mailbox} ${formik.values.client?.office?.mailbox_prefix}${formik.values.client?.id} | ${formik.values.client?.office?.name}`}
                                  color="primary"
                                  size="small"
                                />
                              )}
                            </Stack>

                            <Divider sx={{ mb: 2 }} />

                            {/* Body */}
                            <Grid container spacing={1.5}>
                              <Grid size={{ xs: 12, sm: 3 }}>
                                <Label label={textT?.clientCard?.fullName} value={formik.values.client?.full_name} />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 3 }}>
                                <Label
                                  label={textT?.clientCard?.identification}
                                  value={formik.values.client?.identification}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 3 }}>
                                <Label label={textT?.clientCard?.email} value={formik.values.client?.email} />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 3 }}>
                                <Label
                                  label={textT?.clientCard?.poundFee}
                                  value={formatMoney(formik.values.client?.pound_fee, `${currencies.USD.symbol} `)}
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                        {Boolean(formik.touched.client && formik.errors.client) && (
                          <Typography variant="body1" className="mt-2 text-error">
                            {formik.touched.client && (formik.errors.client as string)}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </>
                )}

                {/* Weight and Price Fields - Shelve and Row Fields - Submit Button */}
                {showAllOtherFields && (
                  <>
                    {/* Weight and Price Fields */}
                    <Divider textAlign="left" sx={{ my: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{textT?.packageTitle}</Typography>
                    </Divider>
                    <Grid container spacing={5}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          inputRef={weightFieldRef}
                          fullWidth
                          required
                          type="number"
                          id="weight"
                          name="weight"
                          label={formT?.labels?.weight}
                          placeholder={formT?.placeholders?.weight}
                          value={formik.values.weight}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.weight && formik.errors.weight)}
                          color={Boolean(formik.touched.weight && formik.errors.weight) ? 'error' : 'primary'}
                          helperText={formik.touched.weight && (formik.errors.weight as string)}
                          disabled={formik.isSubmitting || isLoading || blockWeightField}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;

                            e.preventDefault();
                            shelfFieldRef.current?.focus();
                            lastFieldRef.current = shelfFieldRef.current;
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }} className="flex flex-col gap-1 justify-center">
                        <Typography variant="body1" fontWeight={600} gutterBottom>
                          {`${textT?.priceLabel}: ${formatMoney(price, `${currencies.USD.symbol} `)}`}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Shelve and Row Fields */}
                    <Divider textAlign="left" sx={{ my: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{textT?.locationTitle}</Typography>
                    </Divider>
                    <Grid container spacing={5}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Autocomplete
                          freeSolo
                          clearOnBlur={false}
                          options={offices[formik.values.office_id]?.shelves?.split(',') || []}
                          filterOptions={(x) => x}
                          inputValue={formik.values.shelf}
                          onInputChange={(_, newValue) => {
                            // newValue is always a string (or null)
                            formik.setFieldValue('shelf', newValue ?? '');
                          }}
                          disabled={formik.isSubmitting || isLoading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={shelfFieldRef}
                              id="shelf"
                              name="shelf"
                              label={formT?.labels?.shelf}
                              placeholder={formT?.placeholders?.shelf}
                              error={Boolean(formik.touched.shelf && formik.errors.shelf)}
                              color={Boolean(formik.touched.shelf && formik.errors.shelf) ? 'error' : 'primary'}
                              helperText={formik.touched.shelf && (formik.errors.shelf as string)}
                              disabled={formik.isSubmitting || isLoading}
                              onKeyDown={(e) => {
                                if (e.key !== 'Enter') return;

                                e.preventDefault();
                                rowFieldRef.current?.focus();
                                lastFieldRef.current = rowFieldRef.current;
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Autocomplete
                          freeSolo
                          clearOnBlur={false}
                          options={offices[formik.values.office_id]?.rows?.split(',') || []}
                          filterOptions={(x) => x}
                          inputValue={formik.values.row}
                          onInputChange={(_, newValue) => {
                            // newValue is always a string (or null)
                            formik.setFieldValue('row', newValue ?? '');
                          }}
                          disabled={formik.isSubmitting || isLoading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={rowFieldRef}
                              id="row"
                              name="row"
                              label={formT?.labels?.row}
                              placeholder={formT?.placeholders?.row}
                              error={Boolean(formik.touched.row && formik.errors.row)}
                              color={Boolean(formik.touched.row && formik.errors.row) ? 'error' : 'primary'}
                              helperText={formik.touched.row && (formik.errors.row as string)}
                              disabled={formik.isSubmitting || isLoading}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    {/* Submit Button */}
                    <Grid container spacing={5} className="mt-5">
                      <Grid size={{ xs: 12, md: 3 }} offset={{ md: 4.5 }}>
                        <Button
                          fullWidth
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={formik.isSubmitting || isLoading}>
                          {textT?.btnSave}
                        </Button>
                      </Grid>
                    </Grid>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

      {/* Dialog Selector */}
      <Dialog
        open={selectorState.open}
        onClose={() => setSelectorState({ ...selectorState, open: false })}
        aria-labelledby="selector-dialog-title"
        aria-describedby="selector-dialog-description">
        <DialogTitle id="selector-dialog-title">{textT?.selectorDialog?.title}</DialogTitle>
        <DialogContent dividers>
          <List dense disablePadding>
            {selectorState.items.packages.length > 0 && (
              <>
                <ListSubheader disableSticky sx={{ bgcolor: 'transparent', p: 0 }}>
                  <Typography variant="h4" fontWeight={600}>
                    {textT?.selectorDialog?.packagesTitle}
                  </Typography>
                </ListSubheader>

                {selectorState.items.packages.map((p: any) => (
                  <ListItemButton
                    key={p.id}
                    onClick={() => {
                      const weight = p.billing_weight && !isNaN(p.billing_weight) ? p.billing_weight : undefined;
                      setSelectorState({
                        ...selectorState,
                        selected: { package_id: p.id, order_id: '', client: p.client, weight }
                      });
                    }}
                    selected={selectorState.selected.package_id === p.id}
                    sx={{ borderRadius: 1 }}>
                    <Radio checked={selectorState.selected.package_id === p.id} tabIndex={-1} disableRipple />
                    <ListItemText
                      primary={
                        <Typography variant="h5">{`${p.client.mailbox} - ${p.client.full_name} - ${p.client.office.name}`}</Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </>
            )}

            {selectorState.items.packages.length > 0 && selectorState.items.orders.length > 0 && (
              <Divider sx={{ my: 4 }} />
            )}

            {selectorState.items.orders.length > 0 && (
              <>
                <ListSubheader disableSticky sx={{ bgcolor: 'transparent', p: 0 }}>
                  <Typography variant="h4" fontWeight={600}>
                    {textT?.selectorDialog?.ordersTitle}
                  </Typography>
                </ListSubheader>

                {selectorState.items.orders.map((o: any) => (
                  <ListItemButton
                    key={o.id}
                    onClick={() => {
                      const weight =
                        o.packages && o.packages[0] && !isNaN(o.packages[0].billing_weight)
                          ? o.packages[0].billing_weight
                          : undefined;
                      setSelectorState({
                        ...selectorState,
                        selected: { package_id: '', order_id: o.id, client: o.client, weight }
                      });
                    }}
                    selected={selectorState.selected.order_id === o.id}
                    sx={{ borderRadius: 1 }}>
                    <Radio checked={selectorState.selected.order_id === o.id} tabIndex={-1} disableRipple />
                    <ListItemText
                      primary={
                        <Typography variant="h5">{`${o.client.mailbox} - ${o.client.full_name} - ${o.client.office.name}`}</Typography>
                      }
                      secondary={
                        <Typography variant="body1">{`# ${padStartZeros(o.id, 4)} - ${o.products.length} ${textT?.selectorDialog?.productsLabel}`}</Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setSelectorState({ ...selectorState, open: false })}>
            {textT?.btnCancel}
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={() => {
              if (selectorState.selected.package_id !== '') {
                setTrackingItem(
                  'package',
                  selectorState.selected.package_id,
                  selectorState.selected.client,
                  selectorState.selected.weight
                );
              } else if (selectorState.selected.order_id !== '') {
                setTrackingItem(
                  'order',
                  selectorState.selected.order_id,
                  selectorState.selected.client,
                  selectorState.selected.weight
                );
              }

              setSelectorState({ ...selectorState, open: false });
            }}
            disabled={selectorState.selected.package_id === '' && selectorState.selected.order_id === ''}>
            {textT?.btnSelect}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Dialog */}
      <Dialog
        open={errorAlert.open}
        onClose={onAlertClose}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;

          const el = e.target as HTMLElement | null;
          const isTextArea = el?.tagName === 'TEXTAREA';
          const isMultiline = (el as HTMLInputElement | null)?.getAttribute?.('aria-multiline') === 'true';

          // Don’t close if user is writing multi-line text
          if (isTextArea || isMultiline) return;

          e.preventDefault();
          onAlertClose();
        }}
        aria-labelledby="office-alert-title"
        aria-describedby="office-alert-description">
        <DialogTitle id="office-alert-title" variant="h2">
          {textT?.alertTitle}
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText id="office-alert-description" variant="h3">
            {errorAlert.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="primary" onClick={() => onAlertClose()}>
            {textT?.btnClose}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unowned Package Dialog */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={unownedPackageState.open}
        onClose={handleUnownedPackageClose}
        aria-labelledby="unowned-dialog-title"
        aria-describedby="unowned-dialog-description">
        <DialogTitle id="unowned-dialog-title">{textT?.unownedDialog?.title}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            required
            multiline
            rows={2}
            type="text"
            id="unowned-description"
            name="unowned-description"
            label={textT?.unownedDialog?.descriptionLabel}
            placeholder={textT?.unownedDialog?.descriptionPlaceholder}
            value={unownedPackageState.description}
            onChange={(e) => setUnownedPackageState({ ...unownedPackageState, description: e.target.value })}
            error={Boolean(unownedPackageState.descriptionError)}
            color={Boolean(unownedPackageState.descriptionError) ? 'error' : 'primary'}
            helperText={unownedPackageState.descriptionError}
            disabled={unownedPackageState.loading}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={handleUnownedPackageClose}>
            {textT?.btnCancel}
          </Button>
          <Button variant="text" color="primary" onClick={handleUnownedPackage} disabled={unownedPackageState.loading}>
            {textT?.btnSave}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default PackageReception;

const Label = ({ label, value }: { label: string; value: string }) => {
  return (
    <Stack spacing={0.25}>
      <Typography variant="body1" fontWeight={600}>
        {label}
      </Typography>

      <Typography variant="body1" fontWeight={400}>
        {value}
      </Typography>
    </Stack>
  );
};
