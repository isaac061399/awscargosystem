'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
// import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
// import MoneyField from '@/components/MoneyField';

// Helpers Imports
// import { requestDeleteOrderProduct, requestEditOrder, requestNewOrder, requestSearchClients } from '@helpers/request';

// Auth Imports
// import { useAdmin } from '@components/AdminProvider';
// import { hasAllPermissions } from '@helpers/permissions';

import { currencies } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';
import { calculateShippingTotal } from '@/helpers/calculations';

const defaultAlertState = { open: false, type: 'success', message: '' };

const statusColors: any = {
  PRE_ALERTED: 'warning',
  ON_THE_WAY: 'primary',
  READY: 'info',
  DELIVERED: 'success'
};

const paymentStatusColors: any = {
  PENDING: 'warning',
  PAID: 'success'
};

const OrdersEdition = ({ config, packageObj }: { config: any; packageObj: any }) => {
  // const router = useRouter();
  // const { data: admin } = useAdmin();
  // const canCreateMedia = hasAllPermissions('media.create', admin.permissions);

  const { t } = useTranslation();
  const textT: any = useMemo(() => t('packages-view:text', { returnObjects: true, default: {} }), [t]);
  // const formT: any = useMemo(() => t('packages-view:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  // const [isRedirecting, setIsRedirecting] = useState(false);

  // const [isStatusLoading, setIsStatusLoading] = useState(false);
  // const [statusState, setStatusState] = useState({ open: false, action: '' });

  // const [clientLoading, setClientLoading] = useState(false);
  // const [clientOptions, setClientOptions] = useState<any[]>(packageObj ? [packageObj.client] : []);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  // const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        notes: packageObj ? packageObj.notes : null
      }),
      [packageObj]
    ),
    validationSchema: yup.object({
      notes: yup.string()
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      console.log('Submitted values:', values);

      // try {
      //   const result = isEditing
      //     ? await requestEditOrder(order.id, values, i18n.language)
      //     : await requestNewOrder(values, i18n.language);

      //   if (!result.valid) {
      //     return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
      //   }

      //   setAlertState({ open: true, type: 'success', message: formT?.successMessage });

      //   if (isEditing) {
      //     router.refresh();
      //     setTimeout(() => {
      //       setAlertState({ ...defaultAlertState });
      //     }, 5000);
      //   } else {
      //     setIsRedirecting(true);
      //     setTimeout(() => {
      //       router.push(`/packages/edit/${result.id}`);
      //     }, 2000);
      //   }
      //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // } catch (error) {
      //   // console.error(error);
      //   return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      // }
    }
  });

  // const fetchClients = async (search: string) => {
  //   if (!search.trim()) {
  //     setClientOptions([]);

  //     return;
  //   }

  //   if (timeoutRef.current) {
  //     clearTimeout(timeoutRef.current);
  //   }

  //   timeoutRef.current = setTimeout(async () => {
  //     setClientLoading(true);

  //     const result = await requestSearchClients({ search }, i18n.language);

  //     setClientOptions(result.valid ? result.data : []);

  //     setClientLoading(false);
  //   }, 500); // 500ms debounce
  // };

  // const isPending = order ? order.status === ('PENDING' as OrderStatus) : false;
  // const isOnTheWay = order ? order.status === ('ON_THE_WAY' as OrderStatus) : false;
  // const isReady = order ? order.status === ('READY' as OrderStatus) : false;
  // const isDelivered = order ? order.status === ('DELIVERED' as OrderStatus) : false;

  const statusChip: any = {
    label: labelsT?.packageStatus?.[packageObj.status] || 'Unknown',
    color: statusColors[packageObj.status] || 'info'
  };

  const paymentStatusChip: any = {
    label: labelsT?.paymentStatus?.[packageObj.payment_status] || 'Unknown',
    color: paymentStatusColors[packageObj.payment_status] || 'info'
  };

  const packageTotal = calculateShippingTotal(packageObj.billing_amount, config.iva_percentage);

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex flex-col sm:flex-row sm:justify-between justify-start items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Typography variant="h3" className="flex items-center gap-1">
                  <IconButton className="p-1" color="default" LinkComponent={Link} href="/packages">
                    <i className="ri-arrow-left-s-line text-4xl" />
                  </IconButton>
                  {`${textT?.title} ${packageObj.tracking}`}
                </Typography>
              </div>

              {/* <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting || isRedirecting}
                  startIcon={<i className="ri-save-line" />}>
                  {textT?.btnSave}
                </Button>
              </div> */}
            </div>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card>
              {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}

              <CardContent>
                <Grid container spacing={3} alignItems="top">
                  {/* Total */}
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack>
                      <div className="flex items-center gap-1">
                        <Typography variant="overline" color="text.secondary">
                          {textT?.subtotalLabel}:
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {formatMoney(packageTotal.subtotal, currencies.USD.symbol)}
                        </Typography>
                      </div>
                      <div className="flex items-center gap-1">
                        <Typography variant="overline" color="text.secondary">
                          {textT?.totalLabel}:
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {formatMoney(packageTotal.total, currencies.USD.symbol)}
                        </Typography>
                      </div>
                    </Stack>
                  </Grid>

                  {/* Order status */}
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack spacing={1}>
                      <Typography variant="overline" color="text.secondary">
                        {textT?.statusLabel}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Chip label={statusChip.label} color={statusChip.color} size="small" />
                      </Stack>
                    </Stack>
                  </Grid>

                  {/* Payment status */}
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack spacing={1}>
                      <Typography variant="overline" color="text.secondary">
                        {textT?.paymentStatusLabel}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Chip label={paymentStatusChip.label} color={paymentStatusChip.color} size="small" />
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>
                <Divider sx={{ mt: 5 }} />
              </CardContent>

              <CardContent>
                <Grid container spacing={5}>
                  {/* <Grid size={{ xs: 12, md: 8 }}>
                    <Autocomplete
                      options={clientOptions}
                      isOptionEqualToValue={(option, v) => option.id === v.id}
                      value={clientOptions.find((option) => option.id === formik.values.client_id) || null}
                      getOptionLabel={(option) => formatOption(option)}
                      onInputChange={(event, value, reason) => {
                        if (['input', 'clear'].includes(reason)) {
                          fetchClients(value);
                        }
                      }}
                      onChange={(event, value) => {
                        formik.setFieldValue('client_id', value?.id || null);
                      }}
                      loading={clientLoading}
                      loadingText={textT?.loading}
                      noOptionsText={textT?.noOptions}
                      disabled={formik.isSubmitting || isRedirecting}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          id="client_id"
                          name="client_id"
                          label={formT?.labels?.client_id}
                          placeholder={formT?.placeholders?.client_id}
                          error={Boolean(formik.touched.client_id && formik.errors.client_id)}
                          color={Boolean(formik.touched.client_id && formik.errors.client_id) ? 'error' : 'primary'}
                          helperText={formik.touched.client_id && (formik.errors.client_id as string)}
                          disabled={formik.isSubmitting || isRedirecting}
                          slotProps={{
                            input: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {clientLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              )
                            }
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }} />

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="number"
                      name="number"
                      label={formT?.labels?.number}
                      placeholder={formT?.placeholders?.number}
                      value={formik.values.number}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.number && formik.errors.number)}
                      color={Boolean(formik.touched.number && formik.errors.number) ? 'error' : 'primary'}
                      helperText={formik.touched.number && formik.errors.number}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Autocomplete
                      freeSolo
                      clearOnBlur={false}
                      options={sellersPages}
                      inputValue={formik.values.purchase_page}
                      onInputChange={(_, newValue) => {
                        // newValue is always a string (or null)
                        formik.setFieldValue('purchase_page', newValue ?? '');
                      }}
                      disabled={formik.isSubmitting || isRedirecting}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          id="purchase_page"
                          name="purchase_page"
                          label={formT?.labels?.purchase_page}
                          placeholder={formT?.placeholders?.purchase_page}
                          error={Boolean(formik.touched.purchase_page && formik.errors.purchase_page)}
                          color={
                            Boolean(formik.touched.purchase_page && formik.errors.purchase_page) ? 'error' : 'primary'
                          }
                          helperText={formik.touched.purchase_page && (formik.errors.purchase_page as string)}
                          disabled={formik.isSubmitting || isRedirecting}
                        />
                      )}
                    />
                  </Grid> */}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </DashboardLayout>
  );
};

export default OrdersEdition;
