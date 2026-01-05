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

// const htmlEscapeMap: Record<string, string> = {
//   '&': '&amp;',
//   '<': '&lt;',
//   '>': '&gt;',
//   '"': '&quot;',
//   "'": '&#39;'
// };
// const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (match) => htmlEscapeMap[match]);

// type TicketLine = { label: string; value: string };
// const buildTicketHtml = (title: string, subtitle: string, lines: TicketLine[], footer: string) => {
//   const lineItems = lines
//     .filter((line) => line.value.trim() !== '')
//     .map(
//       (line) =>
//         `<div class="row"><span class="label">${escapeHtml(line.label)}</span><span class="value">${escapeHtml(
//           line.value
//         )}</span></div>`
//     )
//     .join('');

//   return `<!doctype html>
// <html>
//   <head>
//     <meta charset="utf-8" />
//     <title>${escapeHtml(title)}</title>
//     <style>
//       * { box-sizing: border-box; font-family: "Courier New", monospace; }
//       body { margin: 0; padding: 12px; color: #000; }
//       h1 { font-size: 14px; margin: 0 0 6px; text-align: center; letter-spacing: 0.5px; }
//       h2 { font-size: 12px; margin: 0 0 8px; text-align: center; font-weight: 400; }
//       .row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; margin: 2px 0; }
//       .label { font-weight: 700; }
//       .value { text-align: right; }
//       .section { margin-top: 8px; border-top: 1px dashed #000; padding-top: 6px; }
//       .footer { margin-top: 8px; font-size: 11px; text-align: center; }
//     </style>
//   </head>
//   <body>
//     <h1>${escapeHtml(title)}</h1>
//     <h2>${escapeHtml(subtitle)}</h2>
//     <div class="section">${lineItems}</div>
//     <div class="footer">${escapeHtml(footer)}</div>
//   </body>
// </html>`;
// };

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
  const [showClientFields, setShowClientFields] = useState<boolean>(false);
  const [showAllOtherFields, setShowAllOtherFields] = useState<boolean>(false);
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
    selected: { package_id: '', order_id: '', client: null }
  });

  const trackingFieldRef = useRef<HTMLInputElement>(null);
  const trackingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const boxNumberFieldRef = useRef<HTMLInputElement>(null);
  const boxNumberTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const weightFieldRef = useRef<HTMLInputElement>(null);
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
        box_number: '',
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
          weight: values.weight,
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

        // const officeName =
        //   offices.find((office) => office.id === values.office_id)?.name || formik.values.client?.office?.name || '';
        // const subtitle = `${textT?.title || 'Package Reception'} - ${officeName}`;
        // const ticketLines: TicketLine[] = [
        //   { label: formT?.labels?.tracking || 'Tracking', value: values.tracking },
        //   { label: formT?.labels?.box_number || 'Box', value: formik.values.client?.box_number || values.box_number },
        //   { label: formT?.labels?.weight || 'Weight', value: values.weight?.toString() || '' },
        //   {
        //     label: textT?.priceLabel || 'Price',
        //     value: formatMoney(price, `${currencies.USD.symbol} `)
        //   },
        //   { label: formT?.labels?.shelf || 'Shelve', value: values.shelf || '' },
        //   { label: formT?.labels?.row || 'Row', value: values.row || '' },
        //   { label: textT?.clientCard?.fullName || 'Client', value: formik.values.client?.full_name || '' },
        //   {
        //     label: textT?.clientCard?.identification || 'ID',
        //     value: formik.values.client?.identification || ''
        //   }
        // ];
        // const footer = new Date().toLocaleString(i18n.language);
        // const ticketHtml = buildTicketHtml(textT?.title || 'Package Reception', subtitle, ticketLines, footer);
        // const electronBridge = (window as any)?.electron;
        // if (typeof electronBridge?.printTicket === 'function') {
        //   void electronBridge.printTicket({ html: ticketHtml, options: { silent: true, printBackground: true } });
        // } else if (typeof electronBridge?.print === 'function') {
        //   void electronBridge.print({ html: ticketHtml, options: { silent: true, printBackground: true } });
        // }

        resetProcess();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  // focus tracking field on mount
  useEffect(() => {
    if (trackingFieldRef.current) {
      trackingFieldRef.current.focus();
    }
  }, []);

  // focus box number field when showClientFields is true
  useEffect(() => {
    if (showClientFields) {
      if (boxNumberFieldRef.current) {
        boxNumberFieldRef.current.focus();
      }
    }
  }, [showClientFields]);

  // focus weight field when showAllOtherFields is true
  useEffect(() => {
    if (showAllOtherFields) {
      if (weightFieldRef.current) {
        weightFieldRef.current.focus();
      }
    }
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
          selected: { package_id: '', order_id: '', client: null }
        });
      } else {
        // set the found item
        if (orders[0]) {
          setTrackingItem('order', orders[0].id, orders[0].client);
        } else if (packages[0]) {
          setTrackingItem('package', packages[0].id, packages[0].client);
        }
      }
    };

    if (formik.values.tracking && formik.values.tracking.length > 0) {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }

      trackingTimeoutRef.current = setTimeout(() => {
        fetchTrackingInfo(formik.values.tracking);
      }, 500);
    } else {
      resetProcess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.tracking]);

  // box number field change effect
  useEffect(() => {
    const fetchClientInfo = async (boxNumber: string) => {
      setIsLoading(true);

      const result = await requestPackagesReceptionClient(boxNumber, i18n.language);

      setIsLoading(false);

      if (!result.valid || !result.client) {
        setErrorAlert({ open: true, inputRef: boxNumberFieldRef, message: textT?.clientAlertMessage });

        return;
      }

      formik.setFieldValue('client', result.client);

      setShowAllOtherFields(true);
    };

    if (formik.values.box_number && formik.values.box_number.length > 0) {
      if (boxNumberTimeoutRef.current) {
        clearTimeout(boxNumberTimeoutRef.current);
      }

      boxNumberTimeoutRef.current = setTimeout(() => {
        fetchClientInfo(formik.values.box_number);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.box_number]);

  // validate same office for client
  useEffect(() => {
    if (formik.values.client) {
      if (formik.values.client.office.id !== formik.values.office_id) {
        setErrorAlert({
          open: true,
          inputRef: boxNumberFieldRef.current ? boxNumberFieldRef : trackingFieldRef,
          message: textT?.officeAlertMessage?.replace('{{ office }}', formik.values.client?.office?.name || '')
        });
      } else if (weightFieldRef.current) {
        weightFieldRef.current.focus();
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
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.weight]);

  const setTrackingItem = (type: 'package' | 'order', id: string, client: any) => {
    if (type === 'package') {
      formik.setFieldValue('package_id', id);
      formik.setFieldValue('order_id', '');
    } else if (type === 'order') {
      formik.setFieldValue('order_id', id);
      formik.setFieldValue('package_id', '');
    }

    formik.setFieldValue('client', client);

    // show the rest of the fields
    setShowClientFields(true);
    setShowAllOtherFields(true);
  };

  const setNoTrackingItem = () => {
    formik.setFieldValue('package_id', '');
    formik.setFieldValue('order_id', '');
    formik.setFieldValue('client', null);

    // show the client fields and focus box number field
    setShowClientFields(true);
    setTimeout(() => {
      if (boxNumberFieldRef.current) {
        boxNumberFieldRef.current.focus();
      }
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
      box_number: '',
      client: null,
      weight: ''
    });

    setShowClientFields(false);
    setShowAllOtherFields(false);
    setPrice(0);
    setSelectorState({
      open: false,
      items: { orders: [], packages: [] },
      selected: { package_id: '', order_id: '', client: null }
    });

    setTimeout(() => {
      if (trackingFieldRef.current) {
        trackingFieldRef.current.focus();
      }
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
                    />
                  </Grid>
                </Grid>

                <Divider className="my-5" />

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
                              inputRef={boxNumberFieldRef}
                              fullWidth
                              required
                              type="text"
                              id="box_number"
                              name="box_number"
                              label={formT?.labels?.box_number}
                              placeholder={formT?.placeholders?.box_number}
                              value={formik.values.box_number}
                              onChange={formik.handleChange}
                              error={Boolean(formik.touched.box_number && formik.errors.box_number)}
                              color={
                                Boolean(formik.touched.box_number && formik.errors.box_number) ? 'error' : 'primary'
                              }
                              helperText={formik.touched.box_number && (formik.errors.box_number as string)}
                              disabled={formik.isSubmitting || isLoading}
                              slotProps={{
                                input: {
                                  endAdornment: isLoading ? <i className="ri-loader-4-line animate-spin" /> : null
                                }
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
                                  label={`${textT?.clientCard?.boxNumber} ${formik.values.client?.box_number} - ${formik.values.client?.office?.name}`}
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

                {showAllOtherFields && (
                  <>
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
                          disabled={formik.isSubmitting || isLoading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }} className="flex flex-col gap-1 justify-center">
                        <Typography variant="body1" fontWeight={600} gutterBottom>
                          {`${textT?.priceLabel}: ${formatMoney(price, `${currencies.USD.symbol} `)}`}
                        </Typography>
                      </Grid>
                    </Grid>

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
                              id="shelf"
                              name="shelf"
                              label={formT?.labels?.shelf}
                              placeholder={formT?.placeholders?.shelf}
                              error={Boolean(formik.touched.shelf && formik.errors.shelf)}
                              color={Boolean(formik.touched.shelf && formik.errors.shelf) ? 'error' : 'primary'}
                              helperText={formik.touched.shelf && (formik.errors.shelf as string)}
                              disabled={formik.isSubmitting || isLoading}
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
                      setSelectorState({
                        ...selectorState,
                        selected: { package_id: p.id, order_id: '', client: p.client }
                      });
                    }}
                    selected={selectorState.selected.package_id === p.id}
                    sx={{ borderRadius: 1 }}>
                    <Radio checked={selectorState.selected.package_id === p.id} tabIndex={-1} disableRipple />
                    <ListItemText
                      primary={
                        <Typography variant="h5">{`${p.client.box_number} - ${p.client.full_name} - ${p.client.office.name}`}</Typography>
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
                      setSelectorState({
                        ...selectorState,
                        selected: { package_id: '', order_id: o.id, client: o.client }
                      });
                    }}
                    selected={selectorState.selected.order_id === o.id}
                    sx={{ borderRadius: 1 }}>
                    <Radio checked={selectorState.selected.order_id === o.id} tabIndex={-1} disableRipple />
                    <ListItemText
                      primary={
                        <Typography variant="h5">{`${o.client.box_number} - ${o.client.full_name} - ${o.client.office.name}`}</Typography>
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
                setTrackingItem('package', selectorState.selected.package_id, selectorState.selected.client);
              } else if (selectorState.selected.order_id !== '') {
                setTrackingItem('order', selectorState.selected.order_id, selectorState.selected.client);
              }

              setSelectorState({ ...selectorState, open: false });
            }}
            disabled={selectorState.selected.package_id === '' && selectorState.selected.order_id === ''}>
            {textT?.btnSelect}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={errorAlert.open}
        // onClose={() => setShowOfficeAlert(false)}
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
          <Button
            variant="text"
            color="primary"
            onClick={() => {
              if (errorAlert.inputRef && errorAlert.inputRef.current) {
                const inputElement = errorAlert.inputRef.current as HTMLInputElement;
                setTimeout(() => {
                  inputElement.focus();
                }, 500);
              }

              setErrorAlert({ ...errorAlert, open: false });
            }}>
            {textT?.btnClose}
          </Button>
        </DialogActions>
      </Dialog>

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
