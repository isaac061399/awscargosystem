'use client';

// React Imports
import { useMemo, useRef, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import MoneyField from '@/components/MoneyField';

// Helpers Imports
import { requestChangeStatusOrder, requestEditOrder, requestNewOrder, requestSearchClients } from '@helpers/request';

// Auth Imports
// import { useAdmin } from '@components/AdminProvider';
// import { hasAllPermissions } from '@helpers/permissions';

import { Currencies } from '@/libs/constants';
import { formatMoney, padStartZeros } from '@/libs/utils';
import { getOrderTotal } from '@/helpers/calculations';
import { OrderStatus } from '@/prisma/generated/enums';

const defaultAlertState = { open: false, type: 'success', message: '' };

const statusColors: any = {
  PENDING: 'warning',
  ON_THE_WAY: 'primary',
  READY: 'info',
  DELIVERED: 'success'
};

const paymentStatusColors: any = {
  PENDING: 'warning',
  PAID: 'success'
};

const formatOption = (option: any) => {
  const extras = [];

  if (option.box_number) {
    extras.push(option.box_number);
  }

  if (option.identification) {
    extras.push(option.identification);
  }

  if (option.email) {
    extras.push(option.email);
  }

  if (extras.length === 0) {
    return `${option.full_name}`;
  }

  return `${option.full_name} (${extras.join(' - ')})`;
};

const productInitialValues = {
  tracking: '',
  code: '',
  name: '',
  description: '',
  quantity: '',
  price: '',
  service_price: '',
  url: '',
  image_url: ''
};

const OrdersEdition = ({ order }: { order?: any }) => {
  const router = useRouter();
  // const { data: admin } = useAdmin();
  // const canCreateMedia = hasAllPermissions('media.create', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('orders-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('orders-edition:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [isEditing] = useState(order);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [statusState, setStatusState] = useState({ open: false, action: '' });

  const [clientLoading, setClientLoading] = useState(false);
  const [clientOptions, setClientOptions] = useState<any[]>(order ? [order.client] : []);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        client_id: order ? order.client?.id : null,
        number: order ? `${order.number}` : '',
        purchase_page: order ? `${order.purchase_page}` : '',
        products: order ? order.products : []
      }),
      [order]
    ),
    validationSchema: yup.object({
      client_id: yup.number().required(formT?.errors?.client_id),
      number: yup.string().required(formT?.errors?.number),
      purchase_page: yup.string().required(formT?.errors?.purchase_page),

      products: yup.array(
        yup.object({
          tracking: yup.string(),
          code: yup.string().required(formT?.errors?.products?.code),
          name: yup.string().required(formT?.errors?.products?.name),
          description: yup.string(),
          quantity: yup
            .number()
            .integer(formT?.errors?.products?.invalidInteger)
            .required(formT?.errors?.products?.quantity),
          price: yup.number().required(formT?.errors?.products?.price),
          service_price: yup.number().required(formT?.errors?.products?.service_price),
          url: yup.string(),
          image_url: yup.string()
        })
      )
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const result = isEditing
          ? await requestEditOrder(order.id, values, i18n.language)
          : await requestNewOrder(values, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        if (isEditing) {
          setTimeout(() => {
            setAlertState({ ...defaultAlertState });
          }, 5000);
        } else {
          setIsRedirecting(true);
          setTimeout(() => {
            router.push(`/orders/edit/${result.id}`);
          }, 2000);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const fetchClients = async (search: string) => {
    if (!search.trim()) {
      setClientOptions([]);

      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setClientLoading(true);

      const result = await requestSearchClients({ search }, i18n.language);

      setClientOptions(result.valid ? result.data : []);

      setClientLoading(false);
    }, 500); // 500ms debounce
  };

  const handleStatusOpen = (action: 'on-the-way' | 'ready' | 'delivered') => {
    setStatusState({ open: true, action });
  };

  const handleStatusClose = () => {
    setStatusState({ open: false, action: '' });
  };

  const handleStatus = async () => {
    setAlertState({ ...defaultAlertState });
    setIsStatusLoading(true);

    const result = await requestChangeStatusOrder(
      order?.id,
      statusState.action as 'on-the-way' | 'ready' | 'delivered',
      i18n.language
    );

    setIsStatusLoading(false);
    handleStatusClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message || textT?.errors?.status });
    } else {
      router.refresh();
    }
  };

  const isPending = order ? order.status === ('PENDING' as OrderStatus) : false;
  const isOnTheWay = order ? order.status === ('ON_THE_WAY' as OrderStatus) : false;
  const isReady = order ? order.status === ('READY' as OrderStatus) : false;
  // const isDelivered = order ? order.status === ('DELIVERED' as OrderStatus) : false;

  const paymentStatusChip: any = { label: '', color: 'info' };

  const statusChip: any = { label: '', color: 'info' };

  let orderTotal = 0;

  if (isEditing) {
    paymentStatusChip.label = labelsT?.orderPaymentStatus?.[order.status] || 'Unknown';
    paymentStatusChip.color = paymentStatusColors[order.status] || 'info';

    statusChip.label = labelsT?.orderStatus?.[order.status] || 'Unknown';
    statusChip.color = statusColors[order.status] || 'info';

    orderTotal = getOrderTotal(formik.values.products);
  }

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex flex-col sm:flex-row sm:justify-between justify-start items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Typography variant="h3" className="flex items-center gap-1">
                  <IconButton className="p-1" color="default" LinkComponent={Link} href="/orders">
                    <i className="ri-arrow-left-s-line text-4xl" />
                  </IconButton>
                  {isEditing ? `${textT?.titleEdit} # ${padStartZeros(order.id, 4)}` : textT?.titleNew}
                </Typography>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {isPending && (
                  <Button
                    size="small"
                    type="button"
                    variant="contained"
                    color="primary"
                    loading={formik.isSubmitting || isRedirecting || isStatusLoading}
                    startIcon={<i className="ri-truck-line" />}
                    onClick={() => handleStatusOpen('on-the-way')}>
                    {textT?.btnOnTheWay}
                  </Button>
                )}
                {isOnTheWay && (
                  <Button
                    size="small"
                    type="button"
                    variant="contained"
                    color="info"
                    loading={formik.isSubmitting || isRedirecting || isStatusLoading}
                    startIcon={<i className="ri-inbox-unarchive-line" />}
                    onClick={() => handleStatusOpen('ready')}>
                    {textT?.btnReady}
                  </Button>
                )}
                {isReady && (
                  <Button
                    size="small"
                    type="button"
                    variant="contained"
                    color="success"
                    loading={formik.isSubmitting || isRedirecting || isStatusLoading}
                    startIcon={<i className="ri-check-double-line" />}
                    onClick={() => handleStatusOpen('delivered')}>
                    {textT?.btnDelivered}
                  </Button>
                )}
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting || isRedirecting || isStatusLoading}
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

              {isEditing && (
                <CardContent>
                  <Grid container spacing={3} alignItems="center">
                    {/* Total */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="overline" color="text.secondary">
                          {textT?.totalLabel}
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {formatMoney(orderTotal, Currencies.USD.symbol)}
                        </Typography>
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
                  </Grid>
                  <Divider sx={{ mt: 5 }} />
                </CardContent>
              )}

              <CardContent>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 8 }}>
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
                      disabled={formik.isSubmitting || isRedirecting || isStatusLoading}
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
                          disabled={formik.isSubmitting || isRedirecting || isStatusLoading}
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
                      disabled={formik.isSubmitting || isRedirecting || isStatusLoading}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="purchase_page"
                      name="purchase_page"
                      label={formT?.labels?.purchase_page}
                      placeholder={formT?.placeholders?.purchase_page}
                      value={formik.values.purchase_page}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.purchase_page && formik.errors.purchase_page)}
                      color={Boolean(formik.touched.purchase_page && formik.errors.purchase_page) ? 'error' : 'primary'}
                      helperText={formik.touched.purchase_page && formik.errors.purchase_page}
                      disabled={formik.isSubmitting || isRedirecting || isStatusLoading}
                    />
                  </Grid>

                  {/* Products Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5" className={`${Boolean(formik.errors.products) ? 'text-error' : ''}`}>
                        {formT?.labels?.products?.title}
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <ProductsAccordionComponent
                      formik={formik}
                      formT={formT}
                      isLoading={isRedirecting || isStatusLoading}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

      {isEditing && (
        <>
          <Dialog
            open={statusState.open}
            onClose={handleStatusClose}
            aria-labelledby="dialog-status-title"
            aria-describedby="dialog-status-description">
            <DialogTitle id="dialog-status-title">{textT?.dialogStatus?.title}</DialogTitle>
            <DialogContent dividers>
              <DialogContentText id="dialog-status-description">
                {statusState.action === 'on-the-way' && textT?.dialogStatus?.onTheWayMessage}
                {statusState.action === 'ready' && textT?.dialogStatus?.readyMessage}
                {statusState.action === 'delivered' && textT?.dialogStatus?.deliveredMessage}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="text" color="secondary" onClick={handleStatusClose} disabled={isStatusLoading}>
                {textT?.btnCancel}
              </Button>
              <Button variant="text" color="primary" onClick={handleStatus} loading={isStatusLoading}>
                {textT?.btnContinue}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};

const ProductsAccordionComponent = ({ formik, formT, isLoading }: { formik: any; formT: any; isLoading: boolean }) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChangeExpanded = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : false);
  };

  const handleAdd = () => {
    const newValue = [...formik.values.products, { ...productInitialValues }];

    formik.setFieldValue('products', newValue);

    setExpanded(`products[${newValue.length - 1}]`);
  };

  const handleRemove = (index: number) => {
    const newValue = [...formik.values.products];

    newValue.splice(index, 1);

    formik.setFieldValue('products', newValue);

    setExpanded(false);
  };

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12 }}>
        <div>
          {formik.values.products?.map((item: any, index: number) => {
            const errors: any = Array.isArray(formik.errors.products) ? formik.errors.products[index] || {} : {};
            const touched: any = Array.isArray(formik.touched.products) ? formik.touched.products[index] || {} : {};
            const hasErrors = Object.keys(errors).length > 0;

            return (
              <Accordion
                key={index}
                variant="outlined"
                disableGutters
                expanded={expanded === `products[${index}]`}
                onChange={handleChangeExpanded(`products[${index}]`)}
                sx={hasErrors ? { borderColor: 'var(--mui-palette-error-main)' } : undefined}>
                <AccordionSummary
                  component="div"
                  aria-controls={`products[${index}]-order`}
                  id={`products[${index}]-header`}
                  sx={{
                    flexDirection: 'row-reverse',
                    color: hasErrors ? 'var(--mui-palette-error-main) !important' : undefined
                  }}>
                  <div className="flex items-center w-full justify-between">
                    <Typography component="span">
                      {item.name}{' '}
                      {item.id && !item.tracking && (
                        <Typography component="span" className="text-sm font-bold text-warning">
                          {`( ${formT?.noTracking} )`}
                        </Typography>
                      )}
                    </Typography>
                    <div className="flex items-center gap-2">
                      <IconButton className="p-1" onClick={() => handleRemove(index)}>
                        <i className="ri-delete-bin-2-line" />
                      </IconButton>
                    </div>
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={5} sx={{ mt: 2 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        type="text"
                        id={`products[${index}].tracking`}
                        name={`products[${index}].tracking`}
                        label={formT?.labels?.products?.tracking}
                        placeholder={formT?.placeholders?.products?.tracking}
                        value={item.tracking}
                        onChange={formik.handleChange}
                        error={Boolean(touched.tracking && errors.tracking)}
                        color={Boolean(touched.tracking && errors.tracking) ? 'error' : 'primary'}
                        helperText={touched.tracking && errors.tracking}
                        disabled={formik.isSubmitting || isLoading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="text"
                        id={`products[${index}].code`}
                        name={`products[${index}].code`}
                        label={formT?.labels?.products?.code}
                        placeholder={formT?.placeholders?.products?.code}
                        value={item.code}
                        onChange={formik.handleChange}
                        error={Boolean(touched.code && errors.code)}
                        color={Boolean(touched.code && errors.code) ? 'error' : 'primary'}
                        helperText={touched.code && errors.code}
                        disabled={formik.isSubmitting || isLoading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="text"
                        id={`products[${index}].name`}
                        name={`products[${index}].name`}
                        label={formT?.labels?.products?.name}
                        placeholder={formT?.placeholders?.products?.name}
                        value={item.name}
                        onChange={formik.handleChange}
                        error={Boolean(touched.name && errors.name)}
                        color={Boolean(touched.name && errors.name) ? 'error' : 'primary'}
                        helperText={touched.name && errors.name}
                        disabled={formik.isSubmitting || isLoading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 12 }}>
                      <TextField
                        fullWidth
                        type="text"
                        id={`products[${index}].description`}
                        name={`products[${index}].description`}
                        label={formT?.labels?.products?.description}
                        placeholder={formT?.placeholders?.products?.description}
                        value={item.description}
                        onChange={formik.handleChange}
                        error={Boolean(touched.description && errors.description)}
                        color={Boolean(touched.description && errors.description) ? 'error' : 'primary'}
                        helperText={touched.description && errors.description}
                        disabled={formik.isSubmitting || isLoading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        id={`products[${index}].quantity`}
                        name={`products[${index}].quantity`}
                        label={formT?.labels?.products?.quantity}
                        placeholder={formT?.placeholders?.products?.quantity}
                        value={item.quantity}
                        onChange={formik.handleChange}
                        error={Boolean(touched.quantity && errors.quantity)}
                        color={Boolean(touched.quantity && errors.quantity) ? 'error' : 'primary'}
                        helperText={touched.quantity && errors.quantity}
                        disabled={formik.isSubmitting || isLoading}
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
                        prefix={`${Currencies.USD.symbol} `}
                        id={`products[${index}].price`}
                        name={`products[${index}].price`}
                        label={formT?.labels?.products?.price}
                        placeholder={formT?.placeholders?.products?.price}
                        value={item.price}
                        onChange={formik.handleChange}
                        error={Boolean(touched.price && errors.price)}
                        color={Boolean(touched.price && errors.price) ? 'error' : 'primary'}
                        helperText={touched.price && errors.price}
                        disabled={formik.isSubmitting || isLoading}
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
                        prefix={`${Currencies.USD.symbol} `}
                        id={`products[${index}].service_price`}
                        name={`products[${index}].service_price`}
                        label={formT?.labels?.products?.service_price}
                        placeholder={formT?.placeholders?.products?.service_price}
                        value={item.service_price}
                        onChange={formik.handleChange}
                        error={Boolean(touched.service_price && errors.service_price)}
                        color={Boolean(touched.service_price && errors.service_price) ? 'error' : 'primary'}
                        helperText={touched.service_price && errors.service_price}
                        disabled={formik.isSubmitting || isLoading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 12 }}>
                      <TextField
                        fullWidth
                        type="text"
                        id={`products[${index}].url`}
                        name={`products[${index}].url`}
                        label={formT?.labels?.products?.url}
                        placeholder={formT?.placeholders?.products?.url}
                        value={item.url}
                        onChange={formik.handleChange}
                        error={Boolean(touched.url && errors.url)}
                        color={Boolean(touched.url && errors.url) ? 'error' : 'primary'}
                        helperText={touched.url && errors.url}
                        disabled={formik.isSubmitting || isLoading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 12 }}>
                      <TextField
                        fullWidth
                        type="text"
                        id={`products[${index}].image_url`}
                        name={`products[${index}].image_url`}
                        label={formT?.labels?.products?.image_url}
                        placeholder={formT?.placeholders?.products?.image_url}
                        value={item.image_url}
                        onChange={formik.handleChange}
                        error={Boolean(touched.image_url && errors.image_url)}
                        color={Boolean(touched.image_url && errors.image_url) ? 'error' : 'primary'}
                        helperText={touched.image_url && errors.image_url}
                        disabled={formik.isSubmitting || isLoading}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
          <Accordion variant="outlined" disableGutters expanded>
            <AccordionDetails sx={{ py: 1, px: 5 }}>
              <div className="text-center">
                <Button type="button" variant="text" onClick={handleAdd}>
                  {formT?.addProductBtn}
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </Grid>
    </Grid>
  );
};

export default OrdersEdition;
