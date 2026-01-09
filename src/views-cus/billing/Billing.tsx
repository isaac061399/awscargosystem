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
import { requestGetBillingLines, requestPackagesReception } from '@/helpers/request';
import { currencies } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';
import { BillingLine, calculateBillingTotal } from '@/helpers/calculations';
import { useConfig } from '@/components/ConfigProvider';
import { Currency } from '@/prisma/generated/enums';

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
        client: null as any
      }),
      []
    ),
    validationSchema: yup.object({
      client: yup.object().required(formT?.errors?.client)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const newValues = {
          client_id: values.client.id
        };

        const result = await requestPackagesReception(newValues, i18n.language);

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

  const removeSelectedLine = (id: string) => {
    // If it’s a base billable line, unselect it from ToBill
    if (billableLines.some((b) => b.id === id)) {
      setBillableLinesSelected((prev) => prev.filter((x) => x.id !== id));

      return;
    }

    // If it’s an extra line (custom/product), remove from selectedLines
    setSelectedLines((prev) => prev.filter((x) => x.id !== id));
  };

  const resetProcess = () => {
    formik.resetForm();

    setTimeout(() => {
      if (clientFieldRef.current) {
        clientFieldRef.current.focus();
      }
    }, 100);
  };

  const openCustomLineDialog = () => {
    formikCustomLine.resetForm();
    setCustomOpen(true);
  };

  const openProductDialog = () => {
    formikProduct.resetForm();
    setProductOpen(true);
  };

  /** --- Totals --- */
  const totals = useMemo(() => {
    const result = calculateBillingTotal(selectedLines, sellingExchangeRate, ivaPercentage);

    return result;
  }, [selectedLines, sellingExchangeRate, ivaPercentage]);

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
            {!cashRegister && (
              <Alert severity="info">
                La caja aún no ha sido abierta para el día de hoy. Por favor, abra la caja para poder registrar
                facturas.
                <Link href="/cash-control?r=billing" className="underline ml-2">
                  Abrir caja
                </Link>
              </Alert>
            )}

            {alertState.open && <Alert severity={alertState.type}>{alertState.message}</Alert>}
          </Grid>
        </Grid>

        <Stack spacing={2}>
          {/* Top row: Client + FX */}
          <Grid container spacing={2} className="items-stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader
                  title={textT?.cards?.client?.title}
                  subheader={textT?.cards?.client?.subtitle}
                  avatar={<i className="ri-user-search-line"></i>}
                />
                <Divider />
                <CardContent>
                  <Stack spacing={5}>
                    <ClientField
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
                        {': '}
                        <b>
                          {formik.values.client.full_name} - {formik.values.client.box_number}
                        </b>
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
                <CardHeader
                  title={textT?.cards?.info?.title}
                  subheader={textT?.cards?.info?.subtitle}
                  avatar={<i className="ri-file-info-line"></i>}
                />
                <Divider />
                <CardContent>
                  <Stack spacing={5}></Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Main content: left = To bill, right = Selected lines + Totals */}
          <Grid container spacing={2} className="items-stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader
                  title={textT?.cards?.billableLines?.title}
                  subheader={textT?.cards?.billableLines?.subtitle}
                />
                <Divider />
                <CardContent>
                  <Box className="h-105">
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
              <Stack spacing={2} className="h-full">
                <Card>
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

                    <Box className="h-90">
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

                <Card>
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
                      <Stack direction="row" spacing={1} className="pt-3">
                        <Button
                          variant="contained"
                          disabled={
                            formik.isSubmitting || isLoading || !formik.values.client || selectedLines.length === 0
                          }
                          fullWidth>
                          {textT?.cards?.totals?.btnSubmit}
                        </Button>
                      </Stack>

                      {!formik.values.client && (
                        <Typography variant="caption" color="text.secondary">
                          {textT?.cards?.totals?.noClientSelected}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
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
