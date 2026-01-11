'use client';

// React Imports
import { useEffect, useMemo, useRef, useState } from 'react';

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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientField from '@/components/custom/ClientField';
import ProductField from '@/components/custom/ProductField';
import Select from '@/components/Select';
import MoneyField from '@/components/MoneyField';

// Helpers Imports
import { requestGetBillingLines } from '@/helpers/request';
import { currencies } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';
import { BillingLine, calculateBillingTotal } from '@/helpers/calculations';
import { useConfig } from '@/components/ConfigProvider';
import { Currency, PaymentMethod } from '@/prisma/generated/enums';

/** ------- Default States ------- */
const defaultAlertState = { open: false, type: 'success', message: '' };

/** ---------- Utils ---------- */
function lineTotal(quantity: number, unit_price: number) {
  return (quantity || 0) * (unit_price || 0);
}

const Billing = ({ cashRegister }: { cashRegister?: any }) => {
  const { configuration } = useConfig();
  const sellingExchangeRate = configuration?.selling_exchange_rate ?? 0;
  const ivaPercentage = configuration?.iva_percentage ?? 0;

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('billing:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('billing:form', { returnObjects: true, default: {} }), [t]);
  const formCustomLineT: any = useMemo(() => t('billing:formCustomLine', { returnObjects: true, default: {} }), [t]);
  const formProductT: any = useMemo(() => t('billing:formProduct', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [billableLines, setBillableLines] = useState<any[]>([]);
  const [billableLinesSelected, setBillableLinesSelected] = useState<any[]>([]);
  const [selectedLines, setSelectedLines] = useState<BillingLine[]>([]);
  const [totals, setTotals] = useState<any>(calculateBillingTotal(selectedLines, sellingExchangeRate, ivaPercentage));

  // Billing lines dialogs
  const [customOpen, setCustomOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const clientFieldRef = useRef<HTMLInputElement>(null);
  const productFieldRef = useRef<HTMLInputElement>(null);
  const customLineCodeFieldRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        client: null as any,
        invoice_type: Object.keys(labelsT?.invoiceType)[0] || '',
        invoice_payment_condition: Object.keys(labelsT?.invoicePaymentCondition)[0] || '',
        payment_currency: Object.keys(labelsT?.currency)[0] || '',
        payment_method: Object.keys(labelsT?.paymentMethod)[0] || '',
        payment_ref: '',
        payment_amount: 0
      }),
      [labelsT]
    ),
    validationSchema: yup.object({
      client: yup.object().required(formT?.errors?.client),
      invoice_type: yup.string().required(formT?.errors?.invoice_type),
      invoice_payment_condition: yup.string().required(formT?.errors?.invoice_payment_condition),
      payment_currency: yup.string().required(formT?.errors?.payment_currency),
      payment_method: yup.string().required(formT?.errors?.payment_method),
      payment_ref: yup.string().when('payment_method', {
        is: PaymentMethod.CASH,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required(formT?.errors?.payment_ref)
      }),
      payment_amount: yup.number().when('payment_method', {
        is: PaymentMethod.CASH,
        then: (schema) => schema.required(formT?.errors?.payment_amount),
        otherwise: (schema) => schema.notRequired()
      })
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      // validate amount vrs total if payment method is cash
      if (
        values.payment_method === PaymentMethod.CASH &&
        values.payment_amount < totals[values.payment_currency].total
      ) {
        formik.setFieldError('payment_amount', formT?.errors?.payment_amount_min);

        return;
      }

      try {
        // const newValues = {
        //   client_id: values.client.id,
        //   invoice_type: values.invoice_type,
        //   invoice_payment_condition: values.invoice_payment_condition
        // };

        // const result = await requestPackagesReception(newValues, i18n.language);

        // if (!result.valid) {
        //   return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        // }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        // TODO: open success dialog with option to print invoice and view change if cash

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const formikCustomLine = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        code: '',
        description: '',
        quantity: 1,
        currency: Currency.CRC,
        unit_price: 0
      }),
      []
    ),
    validationSchema: yup.object({
      code: yup.string().required(formCustomLineT?.errors?.code),
      description: yup.string().required(formCustomLineT?.errors?.description),
      quantity: yup
        .number()
        .integer(formCustomLineT?.errors?.quantityInteger)
        .required(formCustomLineT?.errors?.quantity)
        .min(1, formCustomLineT?.errors?.quantityMinimum),
      currency: yup.string().required(formCustomLineT?.errors?.currency),
      unit_price: yup.number().required(formCustomLineT?.errors?.unit_price)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const line: BillingLine = {
          id: `custom-${Date.now()}`,
          type: 'custom',
          refObj: null,
          ref: values.code,
          description: values.description,
          quantity: values.quantity,
          unit_price: values.unit_price,
          currency: values.currency,
          total: lineTotal(values.quantity, values.unit_price)
        };
        setSelectedLines((prev) => [...prev, line]);

        setCustomOpen(false);
        setTimeout(() => {
          formikCustomLine.resetForm();
        }, 500);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        setAlertState({ open: true, type: 'error', message: formCustomLineT?.errorMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        return;
      }
    }
  });

  const formikProduct = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        product: null as any,
        quantity: 1
      }),
      []
    ),
    validationSchema: yup.object({
      product: yup.object().required(formProductT?.errors?.product),
      quantity: yup
        .number()
        .integer(formProductT?.errors?.quantityInteger)
        .required(formProductT?.errors?.quantity)
        .min(1, formProductT?.errors?.quantityMinimum)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const line: BillingLine = {
          id: `product-${values.product.id}-${Date.now()}`,
          type: 'product',
          refObj: values.product,
          ref: values.product.code,
          description: values.product.name,
          quantity: values.quantity,
          unit_price: values.product.price,
          currency: Currency.CRC,
          total: lineTotal(values.quantity, values.product.price)
        };
        setSelectedLines((prev) => [...prev, line]);

        setProductOpen(false);
        setTimeout(() => {
          formikProduct.resetForm();
        }, 500);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        setAlertState({ open: true, type: 'error', message: formProductT?.errorMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        return;
      }
    }
  });

  // focus client field on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      clientFieldRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // focus custom line code field when custom line dialog opens
  useEffect(() => {
    if (customOpen) {
      setTimeout(() => {
        customLineCodeFieldRef.current?.focus();
      }, 0);
    }
  }, [customOpen]);

  // focus product field when product dialog opens
  useEffect(() => {
    if (productOpen) {
      setTimeout(() => {
        productFieldRef.current?.focus();
      }, 0);
    }
  }, [productOpen]);

  // load billable lines when client changes
  useEffect(() => {
    if (formik.values.client) {
      const fetchLinesData = async () => {
        setIsLoading(true);

        const result = await requestGetBillingLines(formik.values.client?.id || 0, i18n.language);

        setIsLoading(false);
        setBillableLines(result.lines || []);
        setBillableLinesSelected(result.lines || []);
      };

      fetchLinesData();
    } else {
      setBillableLines([]);
      setBillableLinesSelected([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.client]);

  // update selectedLines when billableLinesSelected changes
  useEffect(() => {
    setSelectedLines((prev) => {
      // keep any previously added custom/product lines
      const extras = prev.filter((x) => x.type !== 'package' && x.type !== 'order_product');

      // build selected base billable lines
      const selected: BillingLine[] = billableLinesSelected.map((line) => ({
        id: line.id,
        type: line.type,
        refObj: line.type === 'package' ? line.package : line.order_product,
        ref: line.tracking,
        description: line.description,
        quantity: 1,
        unit_price: line.billing_amount,
        currency: Currency.USD,
        total: line.billing_amount
      }));

      return [...selected, ...extras];
    });
  }, [billableLinesSelected, billableLines]);

  // update totals when selectedLines changes
  useEffect(() => {
    const result = calculateBillingTotal(selectedLines, sellingExchangeRate, ivaPercentage);
    setTotals(result);
  }, [selectedLines, sellingExchangeRate, ivaPercentage]);

  const removeSelectedLine = (id: string) => {
    // If it’s a base billable line, unselect it from ToBill
    if (billableLines.some((b) => b.id === id)) {
      setBillableLinesSelected((prev) => prev.filter((x) => x.id !== id));

      return;
    }

    // If it’s an extra line (custom/product), remove from selectedLines
    setSelectedLines((prev) => prev.filter((x) => x.id !== id));
  };

  const openCustomLineDialog = () => {
    formikCustomLine.resetForm();
    setCustomOpen(true);
  };

  const openProductDialog = () => {
    formikProduct.resetForm();
    setProductOpen(true);
  };

  /** --- grids --- */
  const billableCols: GridColDef[] = [
    {
      field: 'type',
      headerName: textT?.billableLinesTable?.type?.title,
      width: 120,
      renderCell: (params) => {
        const href =
          params.row.type === 'package'
            ? '/packages/view/' + params.row.package.id
            : '/orders/edit/' + params.row.order_product.order.id;

        return (
          <Chip
            size="small"
            label={
              <Tooltip title={textT?.billableLinesTable?.type?.tooltip} placement="top">
                <Link href={href} target="_blank" className="flex items-center gap-1">
                  {textT?.lineTypes?.[params.value]} <i className="ri-information-line text-lg"></i>
                </Link>
              </Tooltip>
            }
          />
        );
      }
    },
    { field: 'tracking', headerName: textT?.billableLinesTable?.tracking?.title, width: 200 },
    { field: 'description', headerName: textT?.billableLinesTable?.description?.title, flex: 1, minWidth: 250 },
    {
      field: 'billing_amount',
      headerName: textT?.billableLinesTable?.amount?.title,
      width: 120,
      valueGetter: (value, row) => formatMoney(row.billing_amount, `${currencies.USD.symbol}`),
      sortable: false
    },
    {
      field: 'location_shelf',
      headerName: textT?.billableLinesTable?.location?.title,
      width: 200,
      renderCell: (params) =>
        params.row.location_shelf && params.row.location_row
          ? textT?.billableLinesTable?.location?.format
              .replace('{{ shelf }}', params.row.location_shelf)
              .replace('{{ row }}', params.row.location_row)
          : textT?.billableLinesTable?.location?.noLocation,
      sortable: false
    }
  ];

  const selectedCols: GridColDef[] = [
    {
      field: 'type',
      headerName: textT?.selectedLinesTable?.type?.title,
      width: 120,
      renderCell: (params) => <Chip size="small" label={textT?.lineTypes?.[params.value]} />
    },
    { field: 'ref', headerName: textT?.selectedLinesTable?.ref?.title, width: 200 },
    { field: 'description', headerName: textT?.selectedLinesTable?.description?.title, flex: 1, minWidth: 250 },
    { field: 'quantity', headerName: textT?.selectedLinesTable?.quantity?.title, width: 80, type: 'number' },
    {
      field: 'unit_price',
      headerName: textT?.selectedLinesTable?.unit_price?.title,
      width: 120,
      valueGetter: (value, row) => formatMoney(row.unit_price, `${currencies[row.currency].symbol} `),
      sortable: false
    },
    {
      field: 'total',
      headerName: textT?.selectedLinesTable?.total?.title,
      width: 120,
      valueGetter: (value, row) => formatMoney(row.total, `${currencies[row.currency].symbol} `),
      sortable: false
    },
    {
      field: 'actions',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton aria-label="remove line" onClick={() => removeSelectedLine(params.row.id)}>
          <i className="ri-delete-bin-2-fill" />
        </IconButton>
      )
    }
  ];

  console.log(formik.errors);

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={5} className="mb-5">
          <Grid size={{ xs: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <Typography variant="h3" className="flex items-center gap-1">
                {textT?.title}
              </Typography>
              <div className="flex items-center gap-2"></div>
            </div>
            <Divider />
          </Grid>
          {!cashRegister && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                {textT?.cashRegisterAlert}
                <Link href="/cash-control?r=billing" className="underline ml-2">
                  {textT?.cashRegisterAlertBtn}
                </Link>
              </Alert>
            </Grid>
          )}

          {alertState.open && (
            <Grid size={{ xs: 12 }}>
              <Alert severity={alertState.type}>{alertState.message}</Alert>
            </Grid>
          )}
        </Grid>

        <Stack spacing={2}>
          {/* Top row: Client + FX */}
          <Grid container spacing={2} className="items-stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader title={textT?.cards?.client?.title} subheader={textT?.cards?.client?.subtitle} />
                <Divider />
                <CardContent>
                  <Stack spacing={5}>
                    <ClientField
                      isBilling
                      inputRef={clientFieldRef}
                      initialOptions={[]}
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
                      disabled={formik.isSubmitting || isLoading}
                    />

                    {formik.values.client ? (
                      <Alert severity="success">
                        {textT?.cards?.client?.clientSelected}
                        <b>
                          {formik.values.client.full_name} - {formik.values.client.box_number}
                        </b>
                        <br />
                        <Link href={`/clients/edit/${formik.values.client.id}`} target="_blank" className="underline">
                          {textT?.cards?.client?.clientSelectedLink}
                        </Link>
                      </Alert>
                    ) : (
                      <Alert severity="info">{textT?.cards?.client?.noClientSelected}</Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader title={textT?.cards?.info?.title} subheader={textT?.cards?.info?.subtitle} />
                <Divider />
                <CardContent>
                  <Stack spacing={5}>
                    <Select
                      options={Object.keys(labelsT?.invoiceType).map((value) => ({
                        value,
                        label: labelsT?.invoiceType[value]
                      }))}
                      fullWidth
                      required
                      id="invoice_type"
                      name="invoice_type"
                      label={formT?.labels?.invoice_type}
                      placeholder={formT?.placeholders?.invoice_type}
                      value={formik.values.invoice_type}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.invoice_type && formik.errors.invoice_type)}
                      color={Boolean(formik.touched.invoice_type && formik.errors.invoice_type) ? 'error' : 'primary'}
                      helperText={formik.touched.invoice_type && (formik.errors.invoice_type as string)}
                      disabled={formik.isSubmitting}
                    />
                    <Select
                      options={Object.keys(labelsT?.invoicePaymentCondition).map((value) => ({
                        value,
                        label: labelsT?.invoicePaymentCondition[value]
                      }))}
                      fullWidth
                      required
                      id="invoice_payment_condition"
                      name="invoice_payment_condition"
                      label={formT?.labels?.invoice_payment_condition}
                      placeholder={formT?.placeholders?.invoice_payment_condition}
                      value={formik.values.invoice_payment_condition}
                      onChange={formik.handleChange}
                      error={Boolean(
                        formik.touched.invoice_payment_condition && formik.errors.invoice_payment_condition
                      )}
                      color={
                        Boolean(formik.touched.invoice_payment_condition && formik.errors.invoice_payment_condition)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={
                        formik.touched.invoice_payment_condition && (formik.errors.invoice_payment_condition as string)
                      }
                      disabled={formik.isSubmitting}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Middle row: left = To bill, right = Selected lines */}
          <Grid container spacing={2} className="items-stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader
                  title={textT?.cards?.billableLines?.title}
                  subheader={textT?.cards?.billableLines?.subtitle}
                />
                <Divider />
                <CardContent>
                  <Box className="h-117">
                    <DataGrid
                      loading={isLoading}
                      rows={billableLines}
                      columns={billableCols}
                      checkboxSelection
                      disableRowSelectionOnClick
                      disableRowSelectionExcludeModel
                      rowSelectionModel={{
                        type: 'include',
                        ids: new Set(billableLinesSelected.map((line) => line.id))
                      }}
                      onRowSelectionModelChange={(m) => {
                        const linesSelected = billableLines.filter((b) => Array.from(m.ids).includes(b.id));
                        setBillableLinesSelected(linesSelected);
                      }}
                      hideFooterPagination
                      // pagination
                      // pageSizeOptions={[5, 10, 25]}
                      // initialState={{
                      //   pagination: { paginationModel: { pageSize: 10, page: 0 } }
                      // }}
                      localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader
                  title={textT?.cards?.selectedLines?.title}
                  subheader={textT?.cards?.selectedLines?.subtitle}
                />
                <Divider />
                <CardContent>
                  <Stack direction="row" spacing={1} className="mb-3">
                    <Button
                      variant="contained"
                      startIcon={<i className="ri-add-large-line" />}
                      onClick={openCustomLineDialog}>
                      {textT?.cards?.selectedLines?.btnAddCustomLines}
                    </Button>
                    <Button variant="outlined" startIcon={<i className="ri-list-view" />} onClick={openProductDialog}>
                      {textT?.cards?.selectedLines?.btnAddProduct}
                    </Button>
                  </Stack>

                  <Box className="h-105">
                    <DataGrid
                      rows={selectedLines}
                      columns={selectedCols}
                      checkboxSelection={false}
                      disableRowSelectionOnClick
                      hideFooterPagination
                      // pagination
                      // pageSizeOptions={[5, 10, 25]}
                      // initialState={{
                      //   pagination: { paginationModel: { pageSize: 10, page: 0 } }
                      // }}
                      localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Bottom row: left = Totals, right = Payment info */}
          <Grid container spacing={2} className="items-stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader title={textT?.cards?.totals?.title} subheader={textT?.cards?.totals?.subtitle} />
                <Divider />
                <CardContent>
                  <Stack spacing={1}>
                    <Row
                      label={`${textT?.cards?.totals?.subtotal} (${Currency.CRC})`}
                      value={formatMoney(totals[Currency.CRC].subtotal, `${currencies.CRC.symbol} `)}
                    />
                    <Row
                      label={`${textT?.cards?.totals?.subtotal} (${Currency.USD})`}
                      value={formatMoney(totals[Currency.USD].subtotal, `${currencies.USD.symbol} `)}
                    />
                    <Divider className="my-2" />
                    <Row
                      label={`${textT?.cards?.totals?.taxes} (${Currency.CRC})`}
                      value={formatMoney(totals[Currency.CRC].taxes, `${currencies.CRC.symbol} `)}
                      strong
                    />
                    <Row
                      label={`${textT?.cards?.totals?.taxes} (${Currency.USD})`}
                      value={formatMoney(totals[Currency.USD].taxes, `${currencies.USD.symbol} `)}
                      strong
                    />
                    <Divider className="my-2" />
                    <Row
                      label={`${textT?.cards?.totals?.total} (${Currency.CRC})`}
                      value={formatMoney(totals[Currency.CRC].total, `${currencies.CRC.symbol} `)}
                      strong
                    />
                    <Row
                      label={`${textT?.cards?.totals?.total} (${Currency.USD})`}
                      value={formatMoney(totals[Currency.USD].total, `${currencies.USD.symbol} `)}
                      strong
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader title={textT?.cards?.payment?.title} subheader={textT?.cards?.payment?.subtitle} />
                <Divider />
                <CardContent>
                  <Stack spacing={5}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Select
                          options={Object.keys(labelsT?.paymentMethod).map((value) => ({
                            value,
                            label: labelsT?.paymentMethod[value]
                          }))}
                          fullWidth
                          required
                          id="payment_method"
                          name="payment_method"
                          label={formT?.labels?.payment_method}
                          placeholder={formT?.placeholders?.payment_method}
                          value={formik.values.payment_method}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.payment_method && formik.errors.payment_method)}
                          color={
                            Boolean(formik.touched.payment_method && formik.errors.payment_method) ? 'error' : 'primary'
                          }
                          helperText={formik.touched.payment_method && (formik.errors.payment_method as string)}
                          disabled={formik.isSubmitting || isLoading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Select
                          options={Object.keys(labelsT?.currency).map((value) => ({
                            value,
                            label: labelsT?.currency[value]
                          }))}
                          fullWidth
                          required
                          id="payment_currency"
                          name="payment_currency"
                          label={formT?.labels?.payment_currency}
                          placeholder={formT?.placeholders?.payment_currency}
                          value={formik.values.payment_currency}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.payment_currency && formik.errors.payment_currency)}
                          color={
                            Boolean(formik.touched.payment_currency && formik.errors.payment_currency)
                              ? 'error'
                              : 'primary'
                          }
                          helperText={formik.touched.payment_currency && (formik.errors.payment_currency as string)}
                          disabled={formik.isSubmitting || isLoading}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        {formik.values.payment_method !== PaymentMethod.CASH ? (
                          <TextField
                            fullWidth
                            required
                            type="text"
                            id="payment_ref"
                            name="payment_ref"
                            label={formT?.labels?.payment_ref}
                            placeholder={formT?.placeholders?.payment_ref}
                            value={formik.values.payment_ref}
                            onChange={formik.handleChange}
                            error={Boolean(formik.touched.payment_ref && formik.errors.payment_ref)}
                            color={
                              Boolean(formik.touched.payment_ref && formik.errors.payment_ref) ? 'error' : 'primary'
                            }
                            helperText={formik.touched.payment_ref && (formik.errors.payment_ref as string)}
                            disabled={formik.isSubmitting || isLoading}
                          />
                        ) : (
                          <MoneyField
                            fullWidth
                            required
                            type="text"
                            decimalScale={2}
                            decimalSeparator="."
                            thousandSeparator=","
                            prefix={`${currencies[formik.values.payment_currency]?.symbol || ''} `}
                            id="payment_amount"
                            name="payment_amount"
                            label={formT?.labels?.payment_amount}
                            placeholder={formT?.placeholders?.payment_amount}
                            value={formik.values.payment_amount}
                            onChange={formik.handleChange}
                            error={Boolean(formik.touched.payment_amount && formik.errors.payment_amount)}
                            color={
                              Boolean(formik.touched.payment_amount && formik.errors.payment_amount)
                                ? 'error'
                                : 'primary'
                            }
                            helperText={formik.touched.payment_amount && (formik.errors.payment_amount as string)}
                            disabled={formik.isSubmitting || isLoading}
                          />
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 12 }}>
                        <Stack direction="column" spacing={1}>
                          <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            loading={formik.isSubmitting || isLoading}
                            disabled={!formik.values.client || !cashRegister || selectedLines.length === 0}>
                            {textT?.cards?.payment?.btnSubmit}
                          </Button>

                          {!cashRegister ? (
                            <Typography variant="caption" color="text.secondary">
                              {textT?.cards?.payment?.noCashRegisterOpen}
                            </Typography>
                          ) : (
                            !formik.values.client && (
                              <Typography variant="caption" color="text.secondary">
                                {textT?.cards?.payment?.noClientSelected}
                              </Typography>
                            )
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </form>

      {/* Custom line dialog */}
      <Dialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        aria-labelledby="dialog-custom-line-title"
        maxWidth="sm"
        fullWidth>
        <form noValidate onSubmit={formikCustomLine.handleSubmit}>
          <DialogTitle id="dialog-custom-line-title">{textT?.dialogCustomLine?.title}</DialogTitle>
          <DialogContent dividers className="flex flex-col gap-6">
            <TextField
              inputRef={customLineCodeFieldRef}
              fullWidth
              required
              type="text"
              id="code"
              name="code"
              label={formCustomLineT?.labels?.code}
              placeholder={formCustomLineT?.placeholders?.code}
              value={formikCustomLine.values.code}
              onChange={formikCustomLine.handleChange}
              error={Boolean(formikCustomLine.touched.code && formikCustomLine.errors.code)}
              color={Boolean(formikCustomLine.touched.code && formikCustomLine.errors.code) ? 'error' : 'primary'}
              helperText={formikCustomLine.touched.code && (formikCustomLine.errors.code as string)}
              disabled={formikCustomLine.isSubmitting}
            />
            <TextField
              fullWidth
              required
              type="text"
              id="description"
              name="description"
              label={formCustomLineT?.labels?.description}
              placeholder={formCustomLineT?.placeholders?.description}
              value={formikCustomLine.values.description}
              onChange={formikCustomLine.handleChange}
              error={Boolean(formikCustomLine.touched.description && formikCustomLine.errors.description)}
              color={
                Boolean(formikCustomLine.touched.description && formikCustomLine.errors.description)
                  ? 'error'
                  : 'primary'
              }
              helperText={formikCustomLine.touched.description && (formikCustomLine.errors.description as string)}
              disabled={formikCustomLine.isSubmitting}
            />
            <TextField
              fullWidth
              required
              type="number"
              id="quantity"
              name="quantity"
              label={formCustomLineT?.labels?.quantity}
              placeholder={formCustomLineT?.placeholders?.quantity}
              value={formikCustomLine.values.quantity}
              onChange={formikCustomLine.handleChange}
              error={Boolean(formikCustomLine.touched.quantity && formikCustomLine.errors.quantity)}
              color={
                Boolean(formikCustomLine.touched.quantity && formikCustomLine.errors.quantity) ? 'error' : 'primary'
              }
              helperText={formikCustomLine.touched.quantity && (formikCustomLine.errors.quantity as string)}
              disabled={formikCustomLine.isSubmitting}
            />
            <Select
              options={Object.keys(labelsT?.currency).map((value) => ({
                value,
                label: labelsT?.currency[value]
              }))}
              fullWidth
              required
              id="currency"
              name="currency"
              label={formCustomLineT?.labels?.currency}
              placeholder={formCustomLineT?.placeholders?.currency}
              value={formikCustomLine.values.currency}
              onChange={formikCustomLine.handleChange}
              error={Boolean(formikCustomLine.touched.currency && formikCustomLine.errors.currency)}
              color={
                Boolean(formikCustomLine.touched.currency && formikCustomLine.errors.currency) ? 'error' : 'primary'
              }
              helperText={formikCustomLine.touched.currency && (formikCustomLine.errors.currency as string)}
              disabled={formikCustomLine.isSubmitting}
            />
            <MoneyField
              fullWidth
              required
              type="text"
              decimalScale={2}
              decimalSeparator="."
              thousandSeparator=","
              prefix={`${currencies[formikCustomLine.values.currency]?.symbol || ''} `}
              id="unit_price"
              name="unit_price"
              label={formCustomLineT?.labels?.unit_price}
              placeholder={formCustomLineT?.placeholders?.unit_price}
              value={formikCustomLine.values.unit_price}
              onChange={formikCustomLine.handleChange}
              error={Boolean(formikCustomLine.touched.unit_price && formikCustomLine.errors.unit_price)}
              color={
                Boolean(formikCustomLine.touched.unit_price && formikCustomLine.errors.unit_price) ? 'error' : 'primary'
              }
              helperText={formikCustomLine.touched.unit_price && (formikCustomLine.errors.unit_price as string)}
              disabled={formikCustomLine.isSubmitting}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              color="secondary"
              onClick={() => setCustomOpen(false)}
              disabled={formikCustomLine.isSubmitting}>
              {textT?.btnCancel}
            </Button>
            <Button type="submit" variant="text" color="primary" loading={formikCustomLine.isSubmitting}>
              {textT?.btnAdd}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Product dialog */}
      <Dialog
        open={productOpen}
        onClose={() => setProductOpen(false)}
        aria-labelledby="dialog-product-title"
        maxWidth="sm"
        fullWidth>
        <form noValidate onSubmit={formikProduct.handleSubmit}>
          <DialogTitle id="dialog-product-title">{textT?.dialogProduct?.title}</DialogTitle>
          <DialogContent dividers className="flex flex-col gap-6">
            <ProductField
              inputRef={productFieldRef}
              initialOptions={[]}
              isOptionEqualToValue={(option, v) => option.id === v.id}
              loadingText={textT?.loading}
              noOptionsText={textT?.noOptions}
              value={formikProduct.values.product}
              onChange={(value) => {
                formikProduct.setFieldValue('product', value || null);
              }}
              id="product"
              name="product"
              label={formProductT?.labels?.product}
              placeholder={formProductT?.placeholders?.product}
              error={Boolean(formikProduct.touched.product && formikProduct.errors.product)}
              color={Boolean(formikProduct.touched.product && formikProduct.errors.product) ? 'error' : 'primary'}
              helperText={formikProduct.touched.product && (formikProduct.errors.product as string)}
              disabled={formikProduct.isSubmitting || isLoading}
            />
            <TextField
              fullWidth
              required
              type="number"
              id="quantity"
              name="quantity"
              label={formProductT?.labels?.quantity}
              placeholder={formProductT?.placeholders?.quantity}
              value={formikProduct.values.quantity}
              onChange={formikProduct.handleChange}
              error={Boolean(formikProduct.touched.quantity && formikProduct.errors.quantity)}
              color={Boolean(formikProduct.touched.quantity && formikProduct.errors.quantity) ? 'error' : 'primary'}
              helperText={formikProduct.touched.quantity && (formikProduct.errors.quantity as string)}
              disabled={formikProduct.isSubmitting}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              color="secondary"
              onClick={() => setProductOpen(false)}
              disabled={formikProduct.isSubmitting}>
              {textT?.btnCancel}
            </Button>
            <Button type="submit" variant="text" color="primary" loading={formikProduct.isSubmitting}>
              {textT?.btnAdd}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </DashboardLayout>
  );
};

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => {
  return (
    <Stack direction="row" className="items-center justify-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" className={strong ? 'font-semibold' : ''}>
        {value}
      </Typography>
    </Stack>
  );
};

export default Billing;
