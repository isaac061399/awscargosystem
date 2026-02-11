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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import MoneyField from '@/components/MoneyField';
import ClientField from '@/components/custom/ClientField';
import InfoRow from '@/components/custom/InfoRow';

// Helpers Imports
import {
  requestDeleteOrderProduct,
  requestDeliverOrderProducts,
  requestEditOrder,
  requestNewOrder
} from '@helpers/request';
import { useConfig } from '@/components/ConfigProvider';

import { currencies, sellersPages } from '@/libs/constants';
import { formatMoney, padStartZeros } from '@/libs/utils';
import { getOrderTotal } from '@/helpers/calculations';
import { OrderStatus, PaymentStatus } from '@/prisma/generated/enums';

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

const getReadyProducts = (products: any[]) => {
  return products.filter((p) => p.status === OrderStatus.READY);
};

const getDeliveredProducts = (products: any[]) => {
  return products.filter((p) => p.status === OrderStatus.DELIVERED);
};

const getPrintLink = (orderId: number, productIds?: number[]) => {
  return `/print/order-delivered/${orderId}?or=1&${productIds?.map((id) => `products=${id}`).join('&')}`;
};

const OrdersEdition = ({ order }: { order?: any }) => {
  const router = useRouter();

  const { configuration } = useConfig();
  const sellingExchangeRate = configuration?.selling_exchange_rate ?? 0;
  const ivaPercentage = configuration?.iva_percentage ?? 0;

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('orders-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('orders-edition:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [isEditing] = useState(Boolean(order));
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deliverState, setDeliverState] = useState({
    open: false,
    selected: [] as number[],
    success: false,
    error: ''
  });
  const [printDeliveredState, setPrintDeliveredState] = useState({ open: false, selected: [] as number[] });

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        client: order ? order.client : null,
        number: order ? `${order.number}` : '',
        purchase_page: order ? `${order.purchase_page}` : '',
        products: order ? order.products : []
      }),
      [order]
    ),
    validationSchema: yup.object({
      client: yup.object().required(formT?.errors?.client),
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
        const newValues = { ...values, client_id: values.client.id };
        delete newValues.client;

        const result = isEditing
          ? await requestEditOrder(order.id, newValues, i18n.language)
          : await requestNewOrder(newValues, i18n.language);
        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        if (isEditing) {
          router.refresh();
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

  const handleDeliverOpen = () => {
    const selected = readyProducts.map((p) => p.id);
    setDeliverState({ open: true, selected, success: false, error: '' });
  };

  const handleDeliverClose = () => {
    if (deliverState.success) {
      router.refresh();
    }
    setDeliverState({ ...deliverState, open: false });
  };

  const handleDeliver = async () => {
    setDeliverState({ ...deliverState, error: '' });

    if (deliverState.selected.length === 0) {
      setDeliverState({ ...deliverState, error: textT?.dialogDeliver?.selectProductsError });

      return;
    }

    setIsLoading(true);

    const result = await requestDeliverOrderProducts(order?.id, { product_ids: deliverState.selected }, i18n.language);

    setIsLoading(false);

    if (!result.valid) {
      setDeliverState({ ...deliverState, error: result.message || textT?.dialogDeliver?.generalError });
    } else {
      setDeliverState({ ...deliverState, success: true });
    }
  };

  const handlePrintDeliveredOpen = () => {
    const selected = deliveredProducts.map((p) => p.id);
    setPrintDeliveredState({ open: true, selected });
  };

  const orderTotal = getOrderTotal(formik.values.products, sellingExchangeRate, ivaPercentage);
  const paymentStatusChip: any = { label: '', color: 'info' };
  const statusChip: any = { label: '', color: 'info' };

  if (isEditing) {
    statusChip.label = labelsT?.orderStatus?.[order.status] || 'Unknown';
    statusChip.color = statusColors[order.status] || 'info';
    paymentStatusChip.label = labelsT?.paymentStatus?.[order.payment_status] || 'Unknown';
    paymentStatusChip.color = paymentStatusColors[order.payment_status] || 'info';
  }

  const isPayable = order ? order.payment_status === PaymentStatus.PENDING : false;

  const readyProducts = getReadyProducts(formik.values.products);
  const deliveredProducts = getDeliveredProducts(formik.values.products);

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
                {isPayable && (
                  <Button
                    LinkComponent={Link}
                    href={`/billing?client=${order.client.id}`}
                    size="small"
                    type="button"
                    variant="contained"
                    color="success"
                    startIcon={<i className="ri-file-text-line" />}>
                    {textT?.btnBilling}
                  </Button>
                )}

                {isEditing && readyProducts.length > 0 && (
                  <Button
                    size="small"
                    type="button"
                    variant="contained"
                    color="success"
                    startIcon={<i className="ri-check-fill" />}
                    onClick={handleDeliverOpen}>
                    {textT?.btnDeliver}
                  </Button>
                )}

                {isEditing && deliveredProducts.length > 0 && (
                  <Button
                    size="small"
                    type="button"
                    variant="contained"
                    color="primary"
                    startIcon={<i className="ri-printer-line" />}
                    onClick={handlePrintDeliveredOpen}>
                    {textT?.btnPrintDelivered}
                  </Button>
                )}

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
                <Grid container spacing={3} alignItems="top">
                  {/* Subtotal */}
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="overline" color="text.secondary">
                        {textT?.subtotalLabel}
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {formatMoney(orderTotal.usd.subtotal, `${currencies.USD.symbol} `)}
                        {' | '}
                        {formatMoney(orderTotal.crc.subtotal, `${currencies.CRC.symbol} `)}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Total */}
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="overline" color="text.secondary">
                        {textT?.totalLabel}
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {formatMoney(orderTotal.usd.total, `${currencies.USD.symbol} `)}
                        {' | '}
                        {formatMoney(orderTotal.crc.total, `${currencies.CRC.symbol} `)}
                      </Typography>
                    </Stack>
                  </Grid>

                  {isEditing && (
                    <>
                      {/* Order status */}
                      <Grid size={{ xs: 12, md: 2 }}>
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
                      <Grid size={{ xs: 12, md: 2 }}>
                        <Stack spacing={1}>
                          <Typography variant="overline" color="text.secondary">
                            {textT?.paymentStatusLabel}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Chip label={paymentStatusChip.label} color={paymentStatusChip.color} size="small" />
                          </Stack>
                        </Stack>
                      </Grid>
                    </>
                  )}
                </Grid>
                <Divider sx={{ mt: 5 }} />
              </CardContent>

              <CardContent>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <ClientField
                      required
                      initialOptions={order ? [order.client] : []}
                      isOptionEqualToValue={(option, v) => option.id === v.id}
                      loadingText={textT?.loading}
                      noOptionsText={textT?.noOptions}
                      value={formik.values.client}
                      onChange={(value) => {
                        formik.setFieldValue('client', value || null);
                      }}
                      id="client"
                      name="client"
                      label={formT?.labels?.client}
                      placeholder={formT?.placeholders?.client}
                      error={Boolean(formik.touched.client && formik.errors.client)}
                      color={Boolean(formik.touched.client && formik.errors.client) ? 'error' : 'primary'}
                      helperText={formik.touched.client && (formik.errors.client as string)}
                      disabled={formik.isSubmitting || isRedirecting}
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
                      filterOptions={(x) => x}
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
                      textT={textT}
                      formT={formT}
                      labelsT={labelsT}
                      isLoading={isRedirecting}
                      isEditing={isEditing}
                      language={i18n.language}
                      orderTotal={orderTotal}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

      {/* Deliver Dialog */}
      {isEditing && readyProducts.length > 0 && (
        <>
          <Dialog
            open={deliverState.open}
            onClose={handleDeliverClose}
            aria-labelledby="dialog-deliver-title"
            aria-describedby="dialog-deliver-description"
            maxWidth="sm"
            fullWidth>
            <DialogTitle id="dialog-deliver-title">{textT?.dialogDeliver?.title}</DialogTitle>
            <DialogContent dividers>
              {!deliverState.success ? (
                <>
                  <DialogContentText id="dialog-deliver-description">
                    {textT?.dialogDeliver?.subtitle}
                  </DialogContentText>
                  <Stack spacing={2} mt={2}>
                    {readyProducts.map((product) => {
                      return (
                        <FormControlLabel
                          key={product.id}
                          control={
                            <Checkbox
                              checked={deliverState.selected.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDeliverState({
                                    ...deliverState,
                                    selected: [...deliverState.selected, product.id]
                                  });
                                } else {
                                  setDeliverState({
                                    ...deliverState,
                                    selected: deliverState.selected.filter((id) => id !== product.id)
                                  });
                                }
                              }}
                            />
                          }
                          label={
                            <Stack direction="column" spacing={0}>
                              <Typography component="span" fontWeight={500}>
                                {product.quantity} x {product.name}
                              </Typography>
                              <Typography component="span" variant="caption" color="text.secondary">
                                {textT?.dialogDeliver?.tracking}: {product.tracking || '--'}
                              </Typography>
                            </Stack>
                          }
                        />
                      );
                    })}
                  </Stack>
                  {deliverState.error && (
                    <Alert severity="error" sx={{ mt: 5 }}>
                      {deliverState.error}
                    </Alert>
                  )}
                </>
              ) : (
                <>
                  <Stack direction="column" spacing={2}>
                    <Button
                      LinkComponent={Link}
                      variant="contained"
                      color="primary"
                      href={getPrintLink(order.id, deliverState.selected)}
                      target="_blank">
                      {textT?.dialogDeliver?.btnPrintTicket}
                    </Button>
                    <Button variant="outlined" color="primary" onClick={handleDeliverClose}>
                      {textT?.dialogDeliver?.btnClose}
                    </Button>
                  </Stack>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button variant="text" color="secondary" onClick={handleDeliverClose} disabled={isLoading}>
                {textT?.dialogDeliver?.btnClose}
              </Button>
              {!deliverState.success && (
                <Button variant="text" color="primary" onClick={handleDeliver} loading={isLoading}>
                  {textT?.dialogDeliver?.btnDeliver}
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Print Delivered Dialog */}
      {isEditing && deliveredProducts.length > 0 && (
        <>
          <Dialog
            open={printDeliveredState.open}
            onClose={() => setPrintDeliveredState({ ...printDeliveredState, open: false })}
            aria-labelledby="dialog-print-delivered-title"
            aria-describedby="dialog-print-delivered-description"
            maxWidth="sm"
            fullWidth>
            <DialogTitle id="dialog-print-delivered-title">{textT?.dialogPrintDelivered?.title}</DialogTitle>
            <DialogContent dividers>
              <DialogContentText id="dialog-print-delivered-description">
                {textT?.dialogPrintDelivered?.subtitle}
              </DialogContentText>
              <Stack spacing={2} mt={2}>
                {deliveredProducts.map((product) => {
                  return (
                    <FormControlLabel
                      key={product.id}
                      control={
                        <Checkbox
                          checked={printDeliveredState.selected.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPrintDeliveredState({
                                ...printDeliveredState,
                                selected: [...printDeliveredState.selected, product.id]
                              });
                            } else {
                              setPrintDeliveredState({
                                ...printDeliveredState,
                                selected: printDeliveredState.selected.filter((id) => id !== product.id)
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Stack direction="column" spacing={0}>
                          <Typography component="span" fontWeight={500}>
                            {product.quantity} x {product.name}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.secondary">
                            {textT?.dialogPrintDelivered?.tracking}: {product.tracking || '--'}
                          </Typography>
                        </Stack>
                      }
                    />
                  );
                })}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                variant="text"
                color="secondary"
                onClick={() => setPrintDeliveredState({ ...printDeliveredState, open: false })}>
                {textT?.dialogPrintDelivered?.btnClose}
              </Button>
              <Button
                LinkComponent={Link}
                variant="text"
                color="primary"
                href={getPrintLink(order.id, printDeliveredState.selected)}
                target="_blank">
                {textT?.dialogPrintDelivered?.btnPrint}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};

const ProductsAccordionComponent = ({
  formik,
  textT,
  formT,
  labelsT,
  isLoading,
  isEditing,
  language,
  orderTotal
}: {
  formik: any;
  textT: any;
  formT: any;
  labelsT: any;
  isLoading: boolean;
  isEditing: boolean;
  language: string;
  orderTotal: {
    usd: { subtotal: number; total: number; items: { subtotal: number; total: number }[] };
    crc: { subtotal: number; total: number; items: { subtotal: number; total: number }[] };
  };
}) => {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [deleteState, setDeleteState] = useState({ open: false, loading: false, index: null, id: null, name: '' });
  const [error, setError] = useState<string | null>(null);

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

  const handleDeleteOpen = (index: number, id: number, name: string) => {
    setDeleteState((prevState: any) => ({ ...prevState, open: true, index, id, name }));
  };

  const handleDeleteClose = () => {
    setDeleteState((prevState: any) => ({ ...prevState, open: false, loading: false }));
  };

  const handleDelete = async () => {
    setDeleteState((prevState: any) => ({ ...prevState, loading: true }));
    setError(null);

    const result = await requestDeleteOrderProduct(deleteState.id || 0, language);

    if (!result.valid) {
      setError(result.message || textT?.deleteProductDialog?.errorMessage);
    } else {
      if (deleteState.index !== null) handleRemove(deleteState.index);
      handleDeleteClose();
    }
  };

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12 }}>
        <div>
          {formik.values.products?.map((item: any, index: number) => {
            const errors: any = Array.isArray(formik.errors.products) ? formik.errors.products[index] || {} : {};
            const touched: any = Array.isArray(formik.touched.products) ? formik.touched.products[index] || {} : {};
            const hasErrors = Object.keys(errors).length > 0;

            let statusChip: any;
            let paymentStatusChip: any;

            if (item.status) {
              statusChip = {
                label: labelsT?.orderStatus?.[item.status] || 'Unknown',
                color: statusColors[item.status] || 'info'
              };
            }
            if (item.payment_status) {
              paymentStatusChip = {
                label: labelsT?.paymentStatus?.[item.payment_status] || 'Unknown',
                color: paymentStatusColors[item.payment_status] || 'info'
              };
            }

            const isNew = !Boolean(item.id);

            const isPending = item ? item.status === OrderStatus.PENDING : false;
            const isOnTheWay = item ? item.status === OrderStatus.ON_THE_WAY : false;
            const isReady = item ? item.status === OrderStatus.READY : false;
            const isDelivered = item ? item.status === OrderStatus.DELIVERED : false;

            const isPaid = item ? item.payment_status === PaymentStatus.PAID : false;

            const canEditInfo = isNew || ((isPending || isOnTheWay) && !isReady && !isDelivered);
            const canEditPrice = isNew || ((isPending || isOnTheWay) && !isReady && !isDelivered && !isPaid);

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
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-5">
                      <Typography component="span">
                        {item.name}
                        {item.tracking && item.tracking !== '' ? ` - ${item.tracking}` : ''}
                      </Typography>
                      {statusChip && (
                        <Chip
                          variant="filled"
                          label={`${textT?.statusLabel}: ${statusChip.label}`}
                          color={statusChip.color}
                          size="small"
                        />
                      )}
                      {paymentStatusChip && (
                        <Chip
                          variant="filled"
                          label={`${textT?.paymentStatusLabel}: ${paymentStatusChip.label}`}
                          color={paymentStatusChip.color}
                          size="small"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <IconButton
                        className="p-1"
                        onClick={() => {
                          if (item.id) {
                            handleDeleteOpen(index, item.id, item.name);
                          } else {
                            handleRemove(index);
                          }
                        }}>
                        <i className="ri-delete-bin-2-line" />
                      </IconButton>
                    </div>
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={5}>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ mb: 3 }} />
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-1">
                          <Typography variant="body1">{textT?.subtotalLabel}:</Typography>
                          <Typography variant="body1">
                            {formatMoney(orderTotal.usd.items[index].subtotal, `${currencies.USD.symbol} `)}
                            {' | '}
                            {formatMoney(orderTotal.crc.items[index].subtotal, `${currencies.CRC.symbol} `)}
                          </Typography>
                        </div>
                        <div className="flex items-center gap-1">
                          <Typography variant="body1">{textT?.totalLabel}:</Typography>
                          <Typography variant="body1">
                            {formatMoney(orderTotal.usd.items[index].total, `${currencies.USD.symbol} `)}
                            {' | '}
                            {formatMoney(orderTotal.crc.items[index].total, `${currencies.CRC.symbol} `)}
                          </Typography>
                        </div>
                      </div>
                      <Divider sx={{ mt: 3 }} />
                    </Grid>
                  </Grid>

                  <Grid container spacing={5} sx={{ mt: 5 }}>
                    {isEditing && (
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
                          slotProps={{ input: { readOnly: !canEditInfo } }}
                        />
                      </Grid>
                    )}
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
                        slotProps={{ input: { readOnly: !canEditInfo } }}
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
                        slotProps={{ input: { readOnly: !canEditInfo } }}
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
                        slotProps={{ input: { readOnly: !canEditInfo } }}
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
                        slotProps={{ input: { readOnly: !canEditPrice } }}
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
                        prefix={`${currencies.USD.symbol} `}
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
                        slotProps={{ input: { readOnly: !canEditPrice } }}
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
                        prefix={`${currencies.USD.symbol} `}
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
                        slotProps={{ input: { readOnly: !canEditPrice } }}
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
                        slotProps={{ input: { readOnly: !canEditInfo } }}
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
                        slotProps={{ input: { readOnly: !canEditInfo } }}
                      />
                    </Grid>
                  </Grid>

                  {/* Location */}
                  {isReady && (
                    <Grid container spacing={5} sx={{ mt: 5 }}>
                      <Grid size={{ xs: 12 }}>
                        <Divider />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }} offset={{ md: 3 }} sx={{ display: 'flex' }}>
                        <Card sx={{ flexGrow: 1 }}>
                          <CardHeader title={textT?.locationInfo?.title} />
                          <CardContent>
                            <Stack spacing={1.25}>
                              <InfoRow label={textT?.locationInfo?.shelf} value={item.location_shelf} />
                              <InfoRow label={textT?.locationInfo?.row} value={item.location_row} />
                              <Divider />
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  )}
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

      <Dialog
        open={deleteState.open}
        onClose={handleDeleteClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{textT?.deleteProductDialog?.title}</DialogTitle>
        <DialogContent dividers>
          <DialogContentText id="alert-dialog-description">
            {textT?.deleteProductDialog?.message?.replace('{{ name }}', deleteState.name || '')}
          </DialogContentText>
          {error && (
            <DialogContentText id="alert-dialog-error" className="text-error mt-2">
              {error} {textT?.deleteProductDialog?.errorMessage}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={handleDeleteClose} disabled={deleteState.loading}>
            {textT?.deleteProductDialog?.btnCancel}
          </Button>
          <Button variant="text" color="primary" onClick={handleDelete} loading={deleteState.loading}>
            {textT?.deleteProductDialog?.btnContinue}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default OrdersEdition;
