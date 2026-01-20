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
import { bankAccounts, currencies } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';
import { BillingLine, calculateBillingPaidAmount, calculateBillingTotal, PaymentLine } from '@/helpers/calculations';
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
  const buyingExchangeRate = configuration?.buying_exchange_rate ?? 0;
  const ivaPercentage = configuration?.iva_percentage ?? 0;

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('billing:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('billing:form', { returnObjects: true, default: {} }), [t]);
  // const formCustomLineT: any = useMemo(() => t('billing:formCustomLine', { returnObjects: true, default: {} }), [t]);
  const formProductT: any = useMemo(() => t('billing:formProduct', { returnObjects: true, default: {} }), [t]);
  const formPaymentT: any = useMemo(() => t('billing:formPayment', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [billableLines, setBillableLines] = useState<any[]>([]);
  const [billableLinesSelected, setBillableLinesSelected] = useState<any[]>([]);
  const [selectedLines, setSelectedLines] = useState<BillingLine[]>([]);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([]);
  const [totals, setTotals] = useState<any>(
    calculateBillingTotal(selectedLines, sellingExchangeRate, buyingExchangeRate, ivaPercentage)
  );
  const [paidAmounts, setPaidAmounts] = useState<any>(calculateBillingPaidAmount(paymentLines, sellingExchangeRate));

  // Billing lines dialogs
  // const [customOpen, setCustomOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const clientFieldRef = useRef<HTMLInputElement>(null);
  // const customLineCodeFieldRef = useRef<HTMLInputElement>(null);
  const productFieldRef = useRef<HTMLInputElement>(null);
  const paymentAmountFieldRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        client: null as any,
        invoice_type: Object.keys(labelsT?.invoiceType)[0] || '',
        invoice_payment_condition: Object.keys(labelsT?.invoicePaymentCondition)[0] || ''
      }),
      [labelsT]
    ),
    validationSchema: yup.object({
      client: yup.object().required(formT?.errors?.client),
      invoice_type: yup.string().required(formT?.errors?.invoice_type),
      invoice_payment_condition: yup.string().required(formT?.errors?.invoice_payment_condition)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      console.log(values);

      // validate amount vrs total if payment method is cash
      if (paidAmounts[Currency.CRC] < totals[Currency.CRC].total) {
        setAlertState({ open: true, type: 'error', message: formT?.amountErrorMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

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

  // const formikCustomLine = useFormik({
  //   validateOnChange: false,
  //   validateOnBlur: false,
  //   enableReinitialize: true,
  //   initialValues: useMemo(
  //     () => ({
  //       code: '',
  //       description: '',
  //       quantity: 1,
  //       currency: Currency.CRC,
  //       unit_price: 0
  //     }),
  //     []
  //   ),
  //   validationSchema: yup.object({
  //     code: yup.string().required(formCustomLineT?.errors?.code),
  //     description: yup.string().required(formCustomLineT?.errors?.description),
  //     quantity: yup
  //       .number()
  //       .integer(formCustomLineT?.errors?.quantityInteger)
  //       .required(formCustomLineT?.errors?.quantity)
  //       .min(1, formCustomLineT?.errors?.quantityMinimum),
  //     currency: yup.string().required(formCustomLineT?.errors?.currency),
  //     unit_price: yup.number().required(formCustomLineT?.errors?.unit_price)
  //   }),
  //   onSubmit: async (values) => {
  //     setAlertState({ ...defaultAlertState });

  //     try {
  //       const line: BillingLine = {
  //         id: `custom-${Date.now()}`,
  //         type: 'custom',
  //         refObj: null,
  //         ref: values.code,
  //         description: values.description,
  //         quantity: values.quantity,
  //         unit_price: values.unit_price,
  //         currency: values.currency,
  //         total: lineTotal(values.quantity, values.unit_price)
  //       };
  //       setSelectedLines((prev) => [...prev, line]);

  //       setCustomOpen(false);
  //       setTimeout(() => {
  //         formikCustomLine.resetForm();
  //       }, 500);
  //       // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     } catch (error) {
  //       // console.error(error);
  //       setAlertState({ open: true, type: 'error', message: formCustomLineT?.errorMessage });
  //       setTimeout(() => {
  //         setAlertState({ ...defaultAlertState });
  //       }, 5000);

  //       return;
  //     }
  //   }
  // });

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
          currency: values.product.currency,
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

  const formikPayment = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        currency: Object.keys(labelsT?.currency)[0] || '',
        method: Object.keys(labelsT?.paymentMethod)[0] || '',
        ref: '',
        ref_bank: Object.keys(bankAccounts)[0],
        amount: 0
      }),
      [labelsT]
    ),
    validationSchema: yup.object({
      currency: yup.string().required(formPaymentT?.errors?.currency),
      method: yup.string().required(formPaymentT?.errors?.method),
      ref: yup.string().when('method', {
        is: PaymentMethod.CASH,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required(formPaymentT?.errors?.ref)
      }),
      ref_bank: yup.string().when('method', {
        is: PaymentMethod.TRANSFER,
        then: (schema) => schema.required(formPaymentT?.errors?.ref_bank),
        otherwise: (schema) => schema.notRequired()
      }),
      amount: yup.number().required(formPaymentT?.errors?.amount)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const line: PaymentLine = {
          id: `${Date.now()}`,
          currency: values.currency as Currency,
          method: values.method as PaymentMethod,
          ref: values.ref,
          ref_bank: values.ref_bank,
          amount: parseFloat(`${values.amount}`)
        };
        setPaymentLines((prev) => [...prev, line]);

        setPaymentOpen(false);
        setTimeout(() => {
          formikPayment.resetForm();
        }, 500);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        setAlertState({ open: true, type: 'error', message: formPaymentT?.errorMessage });
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
  // useEffect(() => {
  //   if (customOpen) {
  //     setTimeout(() => {
  //       customLineCodeFieldRef.current?.focus();
  //     }, 0);
  //   }
  // }, [customOpen]);

  // focus product field when product dialog opens
  useEffect(() => {
    if (productOpen) {
      setTimeout(() => {
        productFieldRef.current?.focus();
      }, 0);
    }
  }, [productOpen]);

  // focus payment field when payment dialog opens
  useEffect(() => {
    if (paymentOpen) {
      setTimeout(() => {
        paymentAmountFieldRef.current?.focus();
      }, 0);
    }
  }, [paymentOpen]);

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
    const result = calculateBillingTotal(selectedLines, sellingExchangeRate, buyingExchangeRate, ivaPercentage);
    setTotals(result);
  }, [selectedLines, sellingExchangeRate, buyingExchangeRate, ivaPercentage]);

  // update paid amounts when paymentLines changes
  useEffect(() => {
    const result = calculateBillingPaidAmount(paymentLines, sellingExchangeRate);
    setPaidAmounts(result);
  }, [paymentLines, sellingExchangeRate]);

  // update payment amount value when dialog opens or currency changes
  useEffect(() => {
    if (!paymentOpen) return;

    const totalToPay = totals[formikPayment.values.currency].total - paidAmounts[formikPayment.values.currency];
    if (totalToPay > 0) {
      formikPayment.setFieldValue('amount', totalToPay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentOpen, formikPayment.values.currency]);

  const removeSelectedLine = (id: string) => {
    // If it’s a base billable line, unselect it from ToBill
    if (billableLines.some((b) => b.id === id)) {
      setBillableLinesSelected((prev) => prev.filter((x) => x.id !== id));

      return;
    }

    // If it’s an extra line (custom/product), remove from selectedLines
    setSelectedLines((prev) => prev.filter((x) => x.id !== id));
  };

  const removePaymentLine = (id: string) => {
    // If it’s an extra line (custom/product), remove from selectedLines
    setPaymentLines((prev) => prev.filter((x) => x.id !== id));
  };

  // const openCustomLineDialog = () => {
  //   formikCustomLine.resetForm();
  //   setCustomOpen(true);
  // };

  const openProductDialog = () => {
    formikProduct.resetForm();
    setProductOpen(true);
  };

  const openPaymentDialog = () => {
    formikPayment.resetForm();
    formikPayment.setFieldValue('amount', totals[Currency.CRC].total);
    setPaymentOpen(true);
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
      },
      sortable: false
    },
    { field: 'tracking', headerName: textT?.billableLinesTable?.tracking?.title, width: 200, sortable: false },
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
    },
    {
      field: 'billing_amount',
      headerName: textT?.billableLinesTable?.amount?.title,
      width: 120,
      valueGetter: (value, row) => formatMoney(row.billing_amount, `${currencies.USD.symbol}`),
      sortable: false
    },
    {
      field: 'description',
      headerName: textT?.billableLinesTable?.description?.title,
      flex: 1,
      minWidth: 250,
      sortable: false
    }
  ];

  const selectedCols: GridColDef[] = [
    {
      field: 'type',
      headerName: textT?.selectedLinesTable?.type?.title,
      width: 120,
      renderCell: (params) => <Chip size="small" label={textT?.lineTypes?.[params.value]} />,
      sortable: false
    },
    { field: 'ref', headerName: textT?.selectedLinesTable?.ref?.title, width: 200, sortable: false },
    {
      field: 'description',
      headerName: textT?.selectedLinesTable?.description?.title,
      flex: 1,
      minWidth: 250,
      sortable: false
    },
    {
      field: 'quantity',
      headerName: textT?.selectedLinesTable?.quantity?.title,
      width: 80,
      type: 'number',
      sortable: false
    },
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

  const paymentCols: GridColDef[] = [
    {
      field: 'method',
      headerName: textT?.paymentLinesTable?.method?.title,
      width: 150,
      valueGetter: (value, row) => labelsT?.paymentMethod?.[row.method],
      sortable: false
    },
    {
      field: 'amount',
      headerName: textT?.paymentLinesTable?.amount?.title,
      width: 150,
      valueGetter: (value, row) => formatMoney(row.amount, `${currencies[row.currency].symbol} `),
      sortable: false
    },
    {
      field: 'ref',
      headerName: textT?.paymentLinesTable?.ref?.title,
      width: 250,
      renderCell: (params) => {
        if (!params.row.ref) return '-';

        return (
          <span>
            {params.row.ref}
            {params.row.method === PaymentMethod.TRANSFER
              ? ` (${bankAccounts[params.row.ref_bank as keyof typeof bankAccounts]})`
              : ''}
          </span>
        );
      },
      sortable: false
    },
    {
      field: 'actions',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton aria-label="remove line" onClick={() => removePaymentLine(params.row.id)}>
          <i className="ri-delete-bin-2-fill" />
        </IconButton>
      )
    }
  ];

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
                          {formik.values.client.full_name}
                          {' - '}
                          {`${formik.values.client.office?.mailbox_prefix}${formik.values.client.id}`}
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
                      hideFooter
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
                      onClick={openProductDialog}>
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
                      hideFooter
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
                    <Divider className="my-2" sx={{ borderWidth: 1, backgroundColor: 'primary.main' }} />
                    <Row
                      label={`${textT?.cards?.totals?.paid} (${Currency.CRC})`}
                      value={formatMoney(paidAmounts[Currency.CRC], `${currencies.CRC.symbol} `)}
                      strong
                    />
                    <Row
                      label={`${textT?.cards?.totals?.paid} (${Currency.USD})`}
                      value={formatMoney(paidAmounts[Currency.USD], `${currencies.USD.symbol} `)}
                      strong
                    />
                    <Divider className="my-2" />
                    <Row
                      label={`${textT?.cards?.totals?.debt} (${Currency.CRC})`}
                      value={formatMoney(
                        totals[Currency.CRC].total - paidAmounts[Currency.CRC],
                        `${currencies.CRC.symbol} `
                      )}
                      strong
                    />
                    <Row
                      label={`${textT?.cards?.totals?.debt} (${Currency.USD})`}
                      value={formatMoney(
                        totals[Currency.USD].total - paidAmounts[Currency.USD],
                        `${currencies.USD.symbol} `
                      )}
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
                      <Grid size={{ xs: 12, sm: 12 }}>
                        <Stack direction="row" spacing={1} className="mb-3">
                          <Button
                            variant="contained"
                            startIcon={<i className="ri-add-large-line" />}
                            onClick={openPaymentDialog}
                            disabled={!formik.values.client || !cashRegister || selectedLines.length === 0}>
                            {textT?.cards?.payment?.btnAddPayment}
                          </Button>
                        </Stack>

                        <Box className="h-60">
                          <DataGrid
                            rows={paymentLines}
                            columns={paymentCols}
                            checkboxSelection={false}
                            disableRowSelectionOnClick
                            hideFooterPagination
                            hideFooter
                            // pagination
                            // pageSizeOptions={[5, 10, 25]}
                            // initialState={{
                            //   pagination: { paginationModel: { pageSize: 10, page: 0 } }
                            // }}
                            localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
                          />
                        </Box>
                      </Grid>
                      {alertState.open && (
                        <Grid size={{ xs: 12, sm: 12 }}>
                          <Alert severity={alertState.type}>{alertState.message}</Alert>
                        </Grid>
                      )}
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
      {/* <Dialog
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
      </Dialog> */}

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

      {/* Payment dialog */}
      <Dialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        aria-labelledby="dialog-payment-title"
        maxWidth="sm"
        fullWidth>
        <form noValidate onSubmit={formikPayment.handleSubmit}>
          <DialogTitle id="dialog-payment-title">{textT?.dialogPayment?.title}</DialogTitle>
          <DialogContent dividers className="flex flex-col gap-6">
            <Select
              options={Object.keys(labelsT?.currency).map((value) => ({
                value,
                label: labelsT?.currency[value]
              }))}
              fullWidth
              required
              id="currency"
              name="currency"
              label={formPaymentT?.labels?.currency}
              placeholder={formPaymentT?.placeholders?.currency}
              value={formikPayment.values.currency}
              onChange={formikPayment.handleChange}
              error={Boolean(formikPayment.touched.currency && formikPayment.errors.currency)}
              color={Boolean(formikPayment.touched.currency && formikPayment.errors.currency) ? 'error' : 'primary'}
              helperText={formikPayment.touched.currency && (formikPayment.errors.currency as string)}
              disabled={formikPayment.isSubmitting || isLoading}
            />
            <Select
              options={Object.keys(labelsT?.paymentMethod).map((value) => ({
                value,
                label: labelsT?.paymentMethod[value]
              }))}
              fullWidth
              required
              id="method"
              name="method"
              label={formPaymentT?.labels?.method}
              placeholder={formPaymentT?.placeholders?.method}
              value={formikPayment.values.method}
              onChange={formikPayment.handleChange}
              error={Boolean(formikPayment.touched.method && formikPayment.errors.method)}
              color={Boolean(formikPayment.touched.method && formikPayment.errors.method) ? 'error' : 'primary'}
              helperText={formikPayment.touched.method && (formikPayment.errors.method as string)}
              disabled={formikPayment.isSubmitting || isLoading}
            />
            <MoneyField
              inputRef={paymentAmountFieldRef}
              fullWidth
              required
              type="text"
              decimalScale={2}
              decimalSeparator="."
              thousandSeparator=","
              prefix={`${currencies[formikPayment.values.currency]?.symbol || ''} `}
              id="amount"
              name="amount"
              label={formPaymentT?.labels?.amount}
              placeholder={formPaymentT?.placeholders?.amount}
              value={formikPayment.values.amount}
              onChange={formikPayment.handleChange}
              error={Boolean(formikPayment.touched.amount && formikPayment.errors.amount)}
              color={Boolean(formikPayment.touched.amount && formikPayment.errors.amount) ? 'error' : 'primary'}
              helperText={formikPayment.touched.amount && (formikPayment.errors.amount as string)}
              disabled={formikPayment.isSubmitting || isLoading}
            />
            {formikPayment.values.method !== PaymentMethod.CASH && (
              <TextField
                fullWidth
                required
                type="text"
                id="ref"
                name="ref"
                label={formPaymentT?.labels?.ref}
                placeholder={formPaymentT?.placeholders?.ref}
                value={formikPayment.values.ref}
                onChange={formikPayment.handleChange}
                error={Boolean(formikPayment.touched.ref && formikPayment.errors.ref)}
                color={Boolean(formikPayment.touched.ref && formikPayment.errors.ref) ? 'error' : 'primary'}
                helperText={formikPayment.touched.ref && (formikPayment.errors.ref as string)}
                disabled={formikPayment.isSubmitting || isLoading}
              />
            )}
            {formikPayment.values.method === PaymentMethod.TRANSFER && (
              <Select
                options={Object.keys(bankAccounts).map((value) => ({
                  value,
                  label: bankAccounts[value as keyof typeof bankAccounts]
                }))}
                fullWidth
                required
                id="ref_bank"
                name="ref_bank"
                label={formPaymentT?.labels?.ref_bank}
                placeholder={formPaymentT?.placeholders?.ref_bank}
                value={formikPayment.values.ref_bank}
                onChange={formikPayment.handleChange}
                error={Boolean(formikPayment.touched.ref_bank && formikPayment.errors.ref_bank)}
                color={Boolean(formikPayment.touched.ref_bank && formikPayment.errors.ref_bank) ? 'error' : 'primary'}
                helperText={formikPayment.touched.ref_bank && (formikPayment.errors.ref_bank as string)}
                disabled={formikPayment.isSubmitting || isLoading}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              color="secondary"
              onClick={() => setPaymentOpen(false)}
              disabled={formikPayment.isSubmitting}>
              {textT?.btnCancel}
            </Button>
            <Button type="submit" variant="text" color="primary" loading={formikPayment.isSubmitting}>
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
