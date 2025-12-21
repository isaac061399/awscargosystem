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

// Helpers Imports
import { requestPackagesReceptionClient, requestPackagesReceptionTracking } from '@/helpers/request';

// Auth Imports
// import { useAdmin } from '@/components/AdminProvider';
// import { hasAllPermissions } from '@/helpers/permissions';

import { currencies } from '@/libs/constants';
import { formatMoney, padStartZeros } from '@/libs/utils';
import { calculateShippingPrice } from '@/helpers/calculations';

const defaultAlertState = { open: false, type: 'success', message: '' };

const PackageReception = ({ offices }: { offices: any[] }) => {
  // const { data: admin } = useAdmin();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('packages-reception:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('packages-reception:form', { returnObjects: true, default: {} }), [t]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [showClientAlert, setShowClientAlert] = useState<boolean>(false);
  const [showOfficeAlert, setShowOfficeAlert] = useState<boolean>(false);
  const [showClientFields, setShowClientFields] = useState<boolean>(false);
  const [showAllOtherFields, setShowAllOtherFields] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(0);
  const [selectorState, setSelectorState] = useState<any>({
    open: false,
    items: { orders: [], packages: [] },
    selected: { type: '', id: '', client: null }
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
        tracking: '',
        box_number: '',
        weight: '',
        shelve: '',
        row: '',
        client: null as any,
        data: {
          type: 'package', // 'package' | 'order'
          id: ''
        }
      }),
      [offices]
    ),
    validationSchema: yup.object({}),
    onSubmit: async (/* values */) => {
      setAlertState({ ...defaultAlertState });

      try {
        // const result = await requestEditConfiguration(values, i18n.language);
        // if (!result.valid) {
        //   return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        // }
        // setAlertState({ open: true, type: 'success', message: formT?.successMessage });
        // setTimeout(() => {
        //   setAlertState({ ...defaultAlertState });
        // }, 5000);
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

  // tracking field change effect
  useEffect(() => {
    const fetchTrackingInfo = async (tracking: string) => {
      setIsLoading(true);

      const result = await requestPackagesReceptionTracking(tracking, i18n.language);

      setIsLoading(false);

      if (!result.valid) {
        // show client field to search
        setShowClientFields(true);

        return;
      }

      const { packages, orders } = result;
      if (packages.length === 0 && orders.length === 0) {
        // show client field to search
        setShowClientFields(true);

        return;
      }

      if (packages.length + orders.length > 1) {
        // show selector dialog
        setSelectorState({ ...selectorState, open: true, items: { packages, orders } });
      } else {
        if (orders[0]) {
          handleSelectorItem('order', orders[0].id, orders[0].client);
        } else if (packages[0]) {
          handleSelectorItem('package', packages[0].id, packages[0].client);
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.tracking]);

  // box number field change effect
  useEffect(() => {
    const fetchClientInfo = async (boxNumber: string) => {
      setIsLoading(true);

      const result = await requestPackagesReceptionClient(boxNumber, i18n.language);

      setIsLoading(false);

      if (!result.valid) {
        setShowClientAlert(true);

        return;
      }

      const { client } = result;
      if (!client) {
        setShowClientAlert(true);

        return;
      }

      formik.setFieldValue('client', client);

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
        setShowOfficeAlert(true);
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

  const handleSelectorItem = (type: string, id: string, client: any) => {
    formik.setFieldValue('data', { type, id });
    formik.setFieldValue('client', client);

    // show the rest of the fields
    setShowClientFields(true);
    setShowAllOtherFields(true);
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Select
                      options={offices.map((o) => ({ value: o.id, label: o.name }))}
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
                </Grid>

                <Divider className="my-5" />

                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      inputRef={trackingFieldRef}
                      fullWidth
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
                </Grid>

                {showClientFields && (
                  <>
                    <Divider textAlign="left" sx={{ my: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{textT?.clientTitle}</Typography>
                    </Divider>
                    <Grid container spacing={5}>
                      {formik.values.data.id === '' && (
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            inputRef={boxNumberFieldRef}
                            fullWidth
                            type="text"
                            id="box_number"
                            name="box_number"
                            label={formT?.labels?.box_number}
                            placeholder={formT?.placeholders?.box_number}
                            value={formik.values.box_number}
                            onChange={formik.handleChange}
                            error={Boolean(formik.touched.box_number && formik.errors.box_number)}
                            color={Boolean(formik.touched.box_number && formik.errors.box_number) ? 'error' : 'primary'}
                            helperText={formik.touched.box_number && (formik.errors.box_number as string)}
                            disabled={formik.isSubmitting || isLoading || formik.values.data.id !== ''}
                            slotProps={{
                              input: {
                                endAdornment: isLoading ? <i className="ri-loader-4-line animate-spin" /> : null
                              }
                            }}
                          />
                        </Grid>
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
                          {`Precio: ${formatMoney(price, `${currencies.USD.symbol} `)}`}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider textAlign="left" sx={{ my: 5, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{textT?.locationTitle}</Typography>
                    </Divider>
                    <Grid container spacing={5}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Autocomplete
                          freeSolo
                          clearOnBlur={false}
                          options={offices[formik.values.office_id]?.shelves?.split(',') || []}
                          inputValue={formik.values.shelve}
                          onInputChange={(_, newValue) => {
                            // newValue is always a string (or null)
                            formik.setFieldValue('shelve', newValue ?? '');
                          }}
                          disabled={formik.isSubmitting || isLoading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required
                              id="shelve"
                              name="shelve"
                              label={formT?.labels?.shelve}
                              placeholder={formT?.placeholders?.shelve}
                              error={Boolean(formik.touched.shelve && formik.errors.shelve)}
                              color={Boolean(formik.touched.shelve && formik.errors.shelve) ? 'error' : 'primary'}
                              helperText={formik.touched.shelve && (formik.errors.shelve as string)}
                              disabled={formik.isSubmitting || isLoading}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Autocomplete
                          freeSolo
                          clearOnBlur={false}
                          options={offices[formik.values.office_id]?.rows?.split(',') || []}
                          inputValue={formik.values.row}
                          onInputChange={(_, newValue) => {
                            // newValue is always a string (or null)
                            formik.setFieldValue('row', newValue ?? '');
                          }}
                          disabled={formik.isSubmitting || isLoading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required
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
                <ListSubheader disableSticky sx={{ bgcolor: 'transparent', px: 0 }}>
                  {textT?.selectorDialog?.packagesTitle}
                </ListSubheader>

                {selectorState.items.packages.map((p: any) => (
                  <ListItemButton
                    key={p.id}
                    onClick={() => {
                      setSelectorState({
                        ...selectorState,
                        selected: { type: 'package', id: p.id, client: p.client }
                      });
                    }}
                    selected={selectorState.selected.type === 'package' && selectorState.selected.id === p.id}
                    sx={{ borderRadius: 1 }}>
                    <Radio
                      checked={selectorState.selected.type === 'package' && selectorState.selected.id === p.id}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemText primary={`${p.client.box_number} - ${p.client.full_name}`} />
                  </ListItemButton>
                ))}
              </>
            )}

            {selectorState.items.packages.length > 0 && selectorState.items.orders.length > 0 && (
              <Divider sx={{ my: 1 }} />
            )}

            {selectorState.items.orders.length > 0 && (
              <>
                <ListSubheader disableSticky sx={{ bgcolor: 'transparent', px: 0 }}>
                  {textT?.selectorDialog?.ordersTitle}
                </ListSubheader>

                {selectorState.items.orders.map((o: any) => (
                  <ListItemButton
                    key={o.id}
                    onClick={() => {
                      setSelectorState({
                        ...selectorState,
                        selected: { type: 'order', id: o.id, client: o.client }
                      });
                    }}
                    selected={selectorState.selected.type === 'order' && selectorState.selected.id === o.id}
                    sx={{ borderRadius: 1 }}>
                    <Radio
                      checked={selectorState.selected.type === 'order' && selectorState.selected.id === o.id}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemText
                      primary={`${o.client.box_number} - ${o.client.full_name}`}
                      secondary={`# ${padStartZeros(o.id, 4)} - ${o.products.length} ${textT?.selectorDialog?.productsLabel}`}
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
              handleSelectorItem(selectorState.selected.type, selectorState.selected.id, selectorState.selected.client);

              setSelectorState({ ...selectorState, open: false });
            }}>
            {textT?.btnSelect}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showOfficeAlert}
        // onClose={() => setShowOfficeAlert(false)}
        aria-labelledby="office-alert-title"
        aria-describedby="office-alert-description">
        <DialogTitle id="office-alert-title" variant="h2">
          {textT?.alertTitle}
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText id="office-alert-description" variant="h3">
            {textT?.officeAlertMessage?.replace('{{ office }}', formik.values.client?.office?.name || '')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="primary" onClick={() => setShowOfficeAlert(false)}>
            {textT?.btnClose}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showClientAlert}
        // onClose={() => setShowClientAlert(false)}
        aria-labelledby="client-alert-title"
        aria-describedby="client-alert-description">
        <DialogTitle id="client-alert-title" variant="h2">
          {textT?.alertTitle}
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText id="client-alert-description" variant="h3">
            {textT?.clientAlertMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="primary" onClick={() => setShowClientAlert(false)}>
            {textT?.btnClose}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default PackageReception;

type LabelProps = {
  label: string;
  value: string;
};

const Label = ({ label, value }: LabelProps) => {
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
