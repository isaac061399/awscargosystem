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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientField from '@/components/custom/ClientField';
import Select from '@/components/Select';
import MoneyField from '@/components/MoneyField';

// Helpers Imports
import { requestNewInvoiceCC } from '@/helpers/request';
import { bankAccounts, currencies } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';
import {
  BillingCCAdditionalCharge,
  BillingCCLine,
  calculateBillingCCTotal,
  calculateBillingChangeAmount,
  calculateBillingMissingAmountOtherCurrency,
  calculateBillingPaidAmount,
  PaymentLine
} from '@/helpers/calculations';
import { useConfig } from '@/components/ConfigProvider';
import { Currency, InvoiceAdditionalChargeType, PaymentMethod } from '@/prisma/generated/enums';

/** ------- Default States ------- */
const defaultAlertState = { open: false, type: 'success', message: '' };

/** ---------- Utils ---------- */
function lineTotal(quantity: number, unit_price: number) {
  return (quantity || 0) * (unit_price || 0);
}

const BillingCC = ({ cashRegister, client }: { cashRegister?: any; client?: any }) => {
  const { configuration } = useConfig();
  const sellingExchangeRate = configuration?.selling_exchange_rate ?? 0;
  const buyingExchangeRate = configuration?.buying_exchange_rate ?? 0;
  const ivaPercentage = configuration?.iva_percentage ?? 0;

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('billing-cc:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('billing-cc:form', { returnObjects: true, default: {} }), [t]);
  const formLineT: any = useMemo(() => t('billing-cc:formLine', { returnObjects: true, default: {} }), [t]);
  const formAdditionalChargeT: any = useMemo(
    () => t('billing-cc:formAdditionalCharge', { returnObjects: true, default: {} }),
    [t]
  );
  const formPaymentT: any = useMemo(() => t('billing-cc:formPayment', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [lines, setLines] = useState<BillingCCLine[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<BillingCCAdditionalCharge[]>([]);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([]);
  const [totals, setTotals] = useState<any>(
    calculateBillingCCTotal(
      lines,
      additionalCharges,
      Currency.CRC,
      sellingExchangeRate,
      buyingExchangeRate,
      ivaPercentage
    )
  );
  const [paidAmount, setPaidAmount] = useState<any>(
    calculateBillingPaidAmount(paymentLines, Currency.CRC, sellingExchangeRate, buyingExchangeRate)
  );
  const [successState, setSuccessState] = useState({ open: false, id: 0, changeAmountCRC: 0 });

  // Billing lines dialogs
  const [lineOpen, setLineOpen] = useState(false);
  const [additionalChargeOpen, setAdditionalChargeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const clientFieldRef = useRef<HTMLInputElement>(null);
  const lineCodeFieldRef = useRef<HTMLInputElement>(null);
  const paymentAmountFieldRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        client: null as any,
        invoice_type: Object.keys(labelsT?.invoiceType)[0] || '',
        invoice_payment_condition: Object.keys(labelsT?.customInvoicePaymentCondition)[0] || '',
        invoice_currency: Currency.CRC
      }),
      [labelsT]
    ),
    validationSchema: yup.object({
      client: yup.object().required(formT?.errors?.client),
      invoice_type: yup.string().required(formT?.errors?.invoice_type),
      invoice_payment_condition: yup.string().required(formT?.errors?.invoice_payment_condition),
      invoice_currency: yup.string().required(formT?.errors?.invoice_currency)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      // validate amount vrs total if payment method is cash
      if (formik.values.invoice_payment_condition === 'CASH' && paidAmount < totals.total) {
        setAlertState({ open: true, type: 'error', message: formT?.amountErrorMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        return;
      }

      try {
        const newValues = {
          client_id: values.client.id,
          type: values.invoice_type,
          payment_condition: values.invoice_payment_condition,
          currency: values.invoice_currency,
          lines,
          additional_charges: additionalCharges,
          payments: paymentLines.map((line) => ({
            currency: line.currency,
            method: line.method,
            ref: line.ref,
            ref_bank: line.ref_bank,
            amount: line.amount
          }))
        };

        const result = await requestNewInvoiceCC(newValues, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        handleOpenSuccess(result.id, result.change);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const formikLine = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        code: '',
        cabys: '',
        description: '',
        quantity: 1,
        currency: Currency.CRC,
        unit_price: 0,
        is_exempt: false
      }),
      []
    ),
    validationSchema: yup.object({
      code: yup.string().required(formLineT?.errors?.code),
      cabys: yup.string().required(formLineT?.errors?.cabys),
      description: yup.string().required(formLineT?.errors?.description),
      quantity: yup
        .number()
        .integer(formLineT?.errors?.quantityInteger)
        .required(formLineT?.errors?.quantity)
        .min(1, formLineT?.errors?.quantityMinimum),
      currency: yup.string().required(formLineT?.errors?.currency),
      unit_price: yup.number().required(formLineT?.errors?.unit_price),
      is_exempt: yup.boolean().required(formLineT?.errors?.is_exempt)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const line: BillingCCLine = {
          id: `${Date.now()}`,
          code: values.code,
          cabys: values.cabys,
          description: values.description,
          quantity: Number(values.quantity),
          unit_price: Number(values.unit_price),
          currency: values.currency,
          is_exempt: values.is_exempt,
          total: lineTotal(Number(values.quantity), Number(values.unit_price))
        };
        setLines((prev) => [...prev, line]);

        setLineOpen(false);
        setTimeout(() => {
          formikLine.resetForm();
        }, 500);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        setAlertState({ open: true, type: 'error', message: formLineT?.errorMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        return;
      }
    }
  });

  const formikAdditionalCharge = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        type: '',
        type_description: '',
        third_party_identification: '',
        third_party_name: '',
        details: '',
        percentage: 0,
        currency: Currency.CRC,
        amount: 0
      }),
      []
    ),
    validationSchema: yup.object({
      type: yup.string().required(formAdditionalChargeT?.errors?.type),

      type_description: yup.string().when('type', {
        is: InvoiceAdditionalChargeType.OTHER,
        then: (schema) => schema.required(formAdditionalChargeT?.errors?.type_description),
        otherwise: (schema) => schema.notRequired()
      }),

      third_party_identification: yup.string().when('type', {
        is: InvoiceAdditionalChargeType.THIRD_PARTY_CHARGE,
        then: (schema) => schema.required(formAdditionalChargeT?.errors?.third_party_identification),
        otherwise: (schema) => schema.notRequired()
      }),
      third_party_name: yup.string().when('type', {
        is: InvoiceAdditionalChargeType.THIRD_PARTY_CHARGE,
        then: (schema) => schema.required(formAdditionalChargeT?.errors?.third_party_name),
        otherwise: (schema) => schema.notRequired()
      }),

      details: yup.string().required(formAdditionalChargeT?.errors?.details),
      percentage: yup.number().required(formAdditionalChargeT?.errors?.percentage),
      currency: yup.string().required(formAdditionalChargeT?.errors?.currency),
      amount: yup
        .number()
        .required(formAdditionalChargeT?.errors?.amount)
        .moreThan(0, formAdditionalChargeT?.errors?.amountMinimum)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const line: BillingCCAdditionalCharge = {
          id: `${Date.now()}`,
          type: values.type as InvoiceAdditionalChargeType,
          type_description: values.type === InvoiceAdditionalChargeType.OTHER ? values.type_description : '',
          third_party_identification:
            values.type === InvoiceAdditionalChargeType.THIRD_PARTY_CHARGE ? values.third_party_identification : '',
          third_party_name:
            values.type === InvoiceAdditionalChargeType.THIRD_PARTY_CHARGE ? values.third_party_name : '',
          details: values.details,
          percentage: Number(values.percentage),
          currency: values.currency,
          amount: Number(values.amount)
        };
        setAdditionalCharges((prev) => [...prev, line]);

        setAdditionalChargeOpen(false);
        setTimeout(() => {
          formikAdditionalCharge.resetForm();
        }, 500);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        setAlertState({ open: true, type: 'error', message: formAdditionalChargeT?.errorMessage });
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
        currency: Currency.CRC,
        method: Object.keys(labelsT?.paymentMethod)[0] || '',
        ref: '',
        ref_bank: '',
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

  // load client if provided or focus client field on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (client) {
        formik.setFieldValue('client', client);
      } else {
        clientFieldRef.current?.focus();
      }
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // focus line code field when line dialog opens
  useEffect(() => {
    if (lineOpen) {
      setTimeout(() => {
        lineCodeFieldRef.current?.focus();
      }, 0);
    }
  }, [lineOpen]);

  // focus payment field when payment dialog opens
  useEffect(() => {
    if (paymentOpen) {
      setTimeout(() => {
        paymentAmountFieldRef.current?.focus();
      }, 0);
    }
  }, [paymentOpen]);

  // update totals when lines and additional charges change
  useEffect(() => {
    const result = calculateBillingCCTotal(
      lines,
      additionalCharges,
      formik.values.invoice_currency,
      sellingExchangeRate,
      buyingExchangeRate,
      ivaPercentage
    );
    setTotals(result);
  }, [
    lines,
    additionalCharges,
    formik.values.invoice_currency,
    sellingExchangeRate,
    buyingExchangeRate,
    ivaPercentage
  ]);

  // update paid amount when paymentLines changes
  useEffect(() => {
    const result = calculateBillingPaidAmount(
      paymentLines,
      formik.values.invoice_currency,
      sellingExchangeRate,
      buyingExchangeRate
    );
    setPaidAmount(result);
  }, [paymentLines, formik.values.invoice_currency, sellingExchangeRate, buyingExchangeRate]);

  // update payment amount and currency value when dialog opens
  useEffect(() => {
    if (!paymentOpen) return;

    const totalToPay = totals.total - paidAmount;
    if (totalToPay >= 0) {
      formikPayment.setFieldValue('amount', totalToPay);
      formikPayment.setFieldValue('currency', formik.values.invoice_currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentOpen]);

  // update payment amount value when currency changes
  useEffect(() => {
    if (formikPayment.values.currency === formik.values.invoice_currency) {
      formikPayment.setFieldValue('amount', missingAmount);
    } else {
      formikPayment.setFieldValue('amount', missingAmountOtherCurrency.amount);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikPayment.values.currency]);

  // update payments lines if invoice payment condition changes
  useEffect(() => {
    if (formik.values.invoice_payment_condition !== 'CASH') {
      setPaymentLines([]);
    }
  }, [formik.values.invoice_payment_condition]);

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((x) => x.id !== id));
  };

  const removeAdditionalCharge = (id: string) => {
    setAdditionalCharges((prev) => prev.filter((x) => x.id !== id));
  };

  const removePaymentLine = (id: string) => {
    setPaymentLines((prev) => prev.filter((x) => x.id !== id));
  };

  const openLineDialog = () => {
    formikLine.resetForm();
    setLineOpen(true);
  };

  const openAdditionalChargeDialog = () => {
    formikAdditionalCharge.resetForm();
    setAdditionalChargeOpen(true);
  };

  const openPaymentDialog = () => {
    formikPayment.resetForm();
    setPaymentOpen(true);
  };

  const handleOpenSuccess = (id: number, changeAmountCRC: number) => {
    setSuccessState({ open: true, id, changeAmountCRC });
  };

  const handleCloseSuccess = () => {
    setSuccessState({ ...successState, open: false });

    // reset process
    window.location.href = window.location.pathname;
  };

  /** --- grids --- */
  const linesCols: GridColDef[] = [
    {
      field: 'code',
      headerName: textT?.linesTable?.code?.title,
      flex: 1,
      minWidth: 200,
      sortable: false
    },
    { field: 'cabys', headerName: textT?.linesTable?.cabys?.title, flex: 1, minWidth: 200, sortable: false },
    {
      field: 'description',
      headerName: textT?.linesTable?.description?.title,
      flex: 1,
      minWidth: 300,
      sortable: false
    },
    {
      field: 'quantity',
      headerName: textT?.linesTable?.quantity?.title,
      flex: 1,
      minWidth: 120,
      sortable: false
    },
    {
      field: 'unit_price',
      headerName: textT?.linesTable?.unit_price?.title,
      flex: 1,
      minWidth: 170,
      sortable: false,
      valueGetter: (value, row) => formatMoney(row.unit_price, `${currencies[row.currency].symbol} `)
    },
    {
      field: 'total',
      headerName: textT?.linesTable?.total?.title,
      flex: 1,
      minWidth: 170,
      sortable: false,
      valueGetter: (value, row) => formatMoney(row.total, `${currencies[row.currency].symbol} `)
    },
    {
      field: 'is_exempt',
      headerName: textT?.linesTable?.is_exempt?.title,
      flex: 1,
      minWidth: 100,
      sortable: false,
      valueGetter: (value, row) => (row.is_exempt ? textT?.yesLabel : textT?.noLabel)
    },
    {
      field: 'actions',
      headerName: '',
      flex: 1,
      minWidth: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton aria-label="remove line" onClick={() => removeLine(params.row.id)}>
          <i className="ri-delete-bin-2-fill" />
        </IconButton>
      )
    }
  ];

  const additionalChargesCols: GridColDef[] = [
    {
      field: 'type',
      headerName: textT?.additionalChargesTable?.type?.title,
      flex: 1,
      minWidth: 400,
      sortable: false,
      renderCell: (params) => {
        const type = labelsT?.invoiceAdditionalChargeType?.[params.row.type] || params.row.type;

        return (
          <div className="flex flex-col gap-0.5">
            <span>{type}</span>
            {params.row.type_description !== '' && (
              <span>
                <strong>{textT?.additionalChargesTable?.type?.description}: </strong>
                {params.row.type_description}
              </span>
            )}
            {params.row.third_party_identification !== '' && (
              <span>
                <strong>{textT?.additionalChargesTable?.type?.thirdPartyIdentification}: </strong>
                {params.row.third_party_identification}
              </span>
            )}
            {params.row.third_party_name !== '' && (
              <span>
                <strong>{textT?.additionalChargesTable?.type?.thirdPartyName}: </strong>
                {params.row.third_party_name}
              </span>
            )}
          </div>
        );
      }
    },
    {
      field: 'details',
      headerName: textT?.additionalChargesTable?.details?.title,
      flex: 1,
      minWidth: 400,
      sortable: false
    },
    {
      field: 'percentage',
      headerName: textT?.additionalChargesTable?.percentage?.title,
      flex: 1,
      minWidth: 120,
      sortable: false
    },
    {
      field: 'amount',
      headerName: textT?.additionalChargesTable?.amount?.title,
      flex: 1,
      minWidth: 170,
      sortable: false,
      valueGetter: (value, row) => formatMoney(row.amount, `${currencies[row.currency].symbol} `)
    },
    {
      field: 'actions',
      headerName: '',
      flex: 1,
      minWidth: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton aria-label="remove line" onClick={() => removeAdditionalCharge(params.row.id)}>
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
      sortable: false,
      valueGetter: (value, row) => labelsT?.paymentMethod?.[row.method]
    },
    {
      field: 'amount',
      headerName: textT?.paymentLinesTable?.amount?.title,
      width: 150,
      sortable: false,
      valueGetter: (value, row) => formatMoney(row.amount, `${currencies[row.currency].symbol} `)
    },
    {
      field: 'ref',
      headerName: textT?.paymentLinesTable?.ref?.title,
      width: 250,
      sortable: false,
      renderCell: (params) => {
        if (!params.row.ref) return '-';

        return (
          <span>
            {params.row.ref}
            {params.row.method === PaymentMethod.TRANSFER
              ? ` (${bankAccounts[params.row.ref_bank as keyof typeof bankAccounts]})`
              : '-'}
          </span>
        );
      }
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

  /** --- vars --- */
  const missingAmount = totals.total - paidAmount >= 0 ? totals.total - paidAmount : 0;
  const missingAmountOtherCurrency = calculateBillingMissingAmountOtherCurrency(
    missingAmount,
    formik.values.invoice_currency,
    sellingExchangeRate,
    buyingExchangeRate
  );
  const changeAmountCRC = calculateBillingChangeAmount(
    paidAmount,
    totals.total,
    formik.values.invoice_currency,
    buyingExchangeRate
  );

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
          {/* Top row: Client + Invoice Data */}
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
                      required
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
                      disabled={formik.isSubmitting}
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
                      options={Object.keys(labelsT?.customInvoicePaymentCondition).map((value) => ({
                        value,
                        label: labelsT?.customInvoicePaymentCondition[value]
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

          {/* Middle row: lines, additional charges */}
          <Grid container spacing={2} className="items-stretch">
            <Grid size={{ xs: 12, md: 12 }}>
              <Card className="h-full">
                <CardHeader title={textT?.cards?.lines?.title} subheader={textT?.cards?.lines?.subtitle} />
                <Divider />
                <CardContent>
                  <Stack direction="row" spacing={1} className="mb-3">
                    <Button
                      variant="contained"
                      startIcon={<i className="ri-add-large-line" />}
                      onClick={openLineDialog}>
                      {textT?.cards?.lines?.btnAdd}
                    </Button>
                  </Stack>

                  <Box>
                    <DataGrid
                      autoHeight
                      rows={lines}
                      columns={linesCols}
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
                      getRowHeight={() => 'auto'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <Card className="h-full">
                <CardHeader
                  title={textT?.cards?.additionalCharges?.title}
                  subheader={textT?.cards?.additionalCharges?.subtitle}
                />
                <Divider />
                <CardContent>
                  <Stack direction="row" spacing={1} className="mb-3">
                    <Button
                      variant="contained"
                      startIcon={<i className="ri-add-large-line" />}
                      onClick={openAdditionalChargeDialog}>
                      {textT?.cards?.additionalCharges?.btnAdd}
                    </Button>
                  </Stack>

                  <Box>
                    <DataGrid
                      autoHeight
                      rows={additionalCharges}
                      columns={additionalChargesCols}
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
                      getRowHeight={() => 'auto'}
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
                  <div className="mb-3">
                    <Select
                      options={Object.keys(labelsT?.currency).map((value) => ({
                        value,
                        label: labelsT?.currency[value]
                      }))}
                      fullWidth
                      required
                      id="invoice_currency"
                      name="invoice_currency"
                      label={formT?.labels?.invoice_currency}
                      // placeholder={formT?.placeholders?.invoice_currency}
                      value={formik.values.invoice_currency}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.invoice_currency && formik.errors.invoice_currency)}
                      color={
                        Boolean(formik.touched.invoice_currency && formik.errors.invoice_currency) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.invoice_currency && (formik.errors.invoice_currency as string)}
                      disabled={formik.isSubmitting}
                    />
                  </div>
                  <Stack spacing={1}>
                    <Divider className="my-2" />
                    <Row
                      label={`${textT?.cards?.totals?.subtotal}`}
                      value={formatMoney(totals.subtotal, `${currencies[formik.values.invoice_currency].symbol} `)}
                    />
                    <Divider className="my-2" />
                    <Row
                      label={`${textT?.cards?.totals?.taxes}`}
                      value={formatMoney(totals.taxes, `${currencies[formik.values.invoice_currency].symbol} `)}
                    />
                    <Divider className="my-2" />
                    <Row
                      label={`${textT?.cards?.totals?.total}`}
                      value={formatMoney(totals.total, `${currencies[formik.values.invoice_currency].symbol} `)}
                      strong
                    />
                    <Divider className="my-2" sx={{ borderWidth: 1, backgroundColor: 'primary.main' }} />
                    <Row
                      label={`${textT?.cards?.totals?.paid}`}
                      value={formatMoney(paidAmount, `${currencies[formik.values.invoice_currency].symbol} `)}
                    />
                    <Divider className="my-2" />
                    <Row
                      label={`${textT?.cards?.totals?.missing}`}
                      value={`${formatMoney(missingAmount, `${currencies[formik.values.invoice_currency].symbol} `)} | ${formatMoney(missingAmountOtherCurrency.amount, `${currencies[missingAmountOtherCurrency.currency].symbol} `)}`}
                    />
                    <Divider className="my-2" />
                    <Row
                      label={`${textT?.cards?.totals?.change}`}
                      value={formatMoney(changeAmountCRC, `${currencies[Currency.CRC].symbol} `)}
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
                            disabled={
                              !formik.values.client ||
                              !cashRegister ||
                              (lines.length === 0 && additionalCharges.length === 0) ||
                              formik.values.invoice_payment_condition !== 'CASH'
                            }>
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
                            loading={formik.isSubmitting}
                            disabled={
                              !formik.values.client ||
                              !cashRegister ||
                              (lines.length === 0 && additionalCharges.length === 0)
                            }>
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

      {/* Line dialog */}
      <Dialog
        open={lineOpen}
        onClose={() => setLineOpen(false)}
        aria-labelledby="dialog-line-title"
        maxWidth="sm"
        fullWidth>
        <form noValidate onSubmit={formikLine.handleSubmit}>
          <DialogTitle id="dialog-line-title">{textT?.dialogLine?.title}</DialogTitle>
          <DialogContent dividers className="flex flex-col gap-6">
            <TextField
              inputRef={lineCodeFieldRef}
              fullWidth
              required
              type="text"
              id="code"
              name="code"
              label={formLineT?.labels?.code}
              placeholder={formLineT?.placeholders?.code}
              value={formikLine.values.code}
              onChange={formikLine.handleChange}
              error={Boolean(formikLine.touched.code && formikLine.errors.code)}
              color={Boolean(formikLine.touched.code && formikLine.errors.code) ? 'error' : 'primary'}
              helperText={formikLine.touched.code && (formikLine.errors.code as string)}
              disabled={formikLine.isSubmitting}
            />
            <TextField
              fullWidth
              required
              type="text"
              id="cabys"
              name="cabys"
              label={formLineT?.labels?.cabys}
              placeholder={formLineT?.placeholders?.cabys}
              value={formikLine.values.cabys}
              onChange={formikLine.handleChange}
              error={Boolean(formikLine.touched.cabys && formikLine.errors.cabys)}
              color={Boolean(formikLine.touched.cabys && formikLine.errors.cabys) ? 'error' : 'primary'}
              helperText={formikLine.touched.cabys && (formikLine.errors.cabys as string)}
              disabled={formikLine.isSubmitting}
            />
            <TextField
              fullWidth
              required
              type="text"
              id="description"
              name="description"
              label={formLineT?.labels?.description}
              placeholder={formLineT?.placeholders?.description}
              value={formikLine.values.description}
              onChange={formikLine.handleChange}
              error={Boolean(formikLine.touched.description && formikLine.errors.description)}
              color={Boolean(formikLine.touched.description && formikLine.errors.description) ? 'error' : 'primary'}
              helperText={formikLine.touched.description && (formikLine.errors.description as string)}
              disabled={formikLine.isSubmitting}
            />
            <TextField
              fullWidth
              required
              type="number"
              id="quantity"
              name="quantity"
              label={formLineT?.labels?.quantity}
              placeholder={formLineT?.placeholders?.quantity}
              value={formikLine.values.quantity}
              onChange={formikLine.handleChange}
              error={Boolean(formikLine.touched.quantity && formikLine.errors.quantity)}
              color={Boolean(formikLine.touched.quantity && formikLine.errors.quantity) ? 'error' : 'primary'}
              helperText={formikLine.touched.quantity && (formikLine.errors.quantity as string)}
              disabled={formikLine.isSubmitting}
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
              label={formLineT?.labels?.currency}
              // placeholder={formLineT?.placeholders?.currency}
              value={formikLine.values.currency}
              onChange={formikLine.handleChange}
              error={Boolean(formikLine.touched.currency && formikLine.errors.currency)}
              color={Boolean(formikLine.touched.currency && formikLine.errors.currency) ? 'error' : 'primary'}
              helperText={formikLine.touched.currency && (formikLine.errors.currency as string)}
              disabled={formikLine.isSubmitting}
            />
            <MoneyField
              fullWidth
              required
              type="text"
              decimalScale={2}
              decimalSeparator="."
              thousandSeparator=","
              prefix={`${currencies[formikLine.values.currency]?.symbol || ''} `}
              id="unit_price"
              name="unit_price"
              label={formLineT?.labels?.unit_price}
              placeholder={formLineT?.placeholders?.unit_price}
              value={formikLine.values.unit_price}
              onChange={formikLine.handleChange}
              error={Boolean(formikLine.touched.unit_price && formikLine.errors.unit_price)}
              color={Boolean(formikLine.touched.unit_price && formikLine.errors.unit_price) ? 'error' : 'primary'}
              helperText={formikLine.touched.unit_price && (formikLine.errors.unit_price as string)}
              disabled={formikLine.isSubmitting}
            />
            <Box display="flex" justifyContent="flex-start">
              <FormControlLabel
                control={
                  <Switch
                    checked={formikLine.values.is_exempt}
                    onChange={(e) => {
                      formikLine.setFieldValue('is_exempt', e.target.checked);
                    }}
                  />
                }
                label={formLineT?.labels?.is_exempt}
                labelPlacement="start"
                sx={{ marginLeft: 0 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              color="secondary"
              onClick={() => setLineOpen(false)}
              disabled={formikLine.isSubmitting}>
              {textT?.btnCancel}
            </Button>
            <Button type="submit" variant="text" color="primary" loading={formikLine.isSubmitting}>
              {textT?.btnAdd}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Additional Charge dialog */}
      <Dialog
        open={additionalChargeOpen}
        onClose={() => setAdditionalChargeOpen(false)}
        aria-labelledby="dialog-additional-charge-title"
        maxWidth="sm"
        fullWidth>
        <form noValidate onSubmit={formikAdditionalCharge.handleSubmit}>
          <DialogTitle id="dialog-additional-charge-title">{textT?.dialogAdditionalCharge?.title}</DialogTitle>
          <DialogContent dividers className="flex flex-col gap-6">
            <Select
              options={Object.keys(labelsT?.invoiceAdditionalChargeType).map((value) => ({
                value,
                label: labelsT?.invoiceAdditionalChargeType[value]
              }))}
              fullWidth
              required
              id="type"
              name="type"
              label={formAdditionalChargeT?.labels?.type}
              placeholder={formAdditionalChargeT?.placeholders?.type}
              value={formikAdditionalCharge.values.type}
              onChange={formikAdditionalCharge.handleChange}
              error={Boolean(formikAdditionalCharge.touched.type && formikAdditionalCharge.errors.type)}
              color={
                Boolean(formikAdditionalCharge.touched.type && formikAdditionalCharge.errors.type) ? 'error' : 'primary'
              }
              helperText={formikAdditionalCharge.touched.type && (formikAdditionalCharge.errors.type as string)}
              disabled={formikAdditionalCharge.isSubmitting}
            />
            {/* only show description if type is OTHER, otherwise set description as type label */}
            {formikAdditionalCharge.values.type === InvoiceAdditionalChargeType.OTHER && (
              <TextField
                fullWidth
                required
                type="text"
                id="type_description"
                name="type_description"
                label={formAdditionalChargeT?.labels?.type_description}
                placeholder={formAdditionalChargeT?.placeholders?.type_description}
                value={formikAdditionalCharge.values.type_description}
                onChange={formikAdditionalCharge.handleChange}
                error={Boolean(
                  formikAdditionalCharge.touched.type_description && formikAdditionalCharge.errors.type_description
                )}
                color={
                  Boolean(
                    formikAdditionalCharge.touched.type_description && formikAdditionalCharge.errors.type_description
                  )
                    ? 'error'
                    : 'primary'
                }
                helperText={
                  formikAdditionalCharge.touched.type_description &&
                  (formikAdditionalCharge.errors.type_description as string)
                }
                disabled={formikAdditionalCharge.isSubmitting}
              />
            )}

            {/* only show third party fields if type is THIRD_PARTY, otherwise set those fields as null */}
            {formikAdditionalCharge.values.type === InvoiceAdditionalChargeType.THIRD_PARTY_CHARGE && (
              <>
                <TextField
                  fullWidth
                  required
                  type="text"
                  id="third_party_identification"
                  name="third_party_identification"
                  label={formAdditionalChargeT?.labels?.third_party_identification}
                  placeholder={formAdditionalChargeT?.placeholders?.third_party_identification}
                  value={formikAdditionalCharge.values.third_party_identification}
                  onChange={formikAdditionalCharge.handleChange}
                  error={Boolean(
                    formikAdditionalCharge.touched.third_party_identification &&
                    formikAdditionalCharge.errors.third_party_identification
                  )}
                  color={
                    Boolean(
                      formikAdditionalCharge.touched.third_party_identification &&
                      formikAdditionalCharge.errors.third_party_identification
                    )
                      ? 'error'
                      : 'primary'
                  }
                  helperText={
                    formikAdditionalCharge.touched.third_party_identification &&
                    (formikAdditionalCharge.errors.third_party_identification as string)
                  }
                  disabled={formikAdditionalCharge.isSubmitting}
                />
                <TextField
                  fullWidth
                  required
                  type="text"
                  id="third_party_name"
                  name="third_party_name"
                  label={formAdditionalChargeT?.labels?.third_party_name}
                  placeholder={formAdditionalChargeT?.placeholders?.third_party_name}
                  value={formikAdditionalCharge.values.third_party_name}
                  onChange={formikAdditionalCharge.handleChange}
                  error={Boolean(
                    formikAdditionalCharge.touched.third_party_name && formikAdditionalCharge.errors.third_party_name
                  )}
                  color={
                    Boolean(
                      formikAdditionalCharge.touched.third_party_name && formikAdditionalCharge.errors.third_party_name
                    )
                      ? 'error'
                      : 'primary'
                  }
                  helperText={
                    formikAdditionalCharge.touched.third_party_name &&
                    (formikAdditionalCharge.errors.third_party_name as string)
                  }
                  disabled={formikAdditionalCharge.isSubmitting}
                />
              </>
            )}
            <TextField
              fullWidth
              required
              type="text"
              id="details"
              name="details"
              label={formAdditionalChargeT?.labels?.details}
              placeholder={formAdditionalChargeT?.placeholders?.details}
              value={formikAdditionalCharge.values.details}
              onChange={formikAdditionalCharge.handleChange}
              error={Boolean(formikAdditionalCharge.touched.details && formikAdditionalCharge.errors.details)}
              color={
                Boolean(formikAdditionalCharge.touched.details && formikAdditionalCharge.errors.details)
                  ? 'error'
                  : 'primary'
              }
              helperText={formikAdditionalCharge.touched.details && (formikAdditionalCharge.errors.details as string)}
              disabled={formikAdditionalCharge.isSubmitting}
            />
            <TextField
              fullWidth
              required
              type="number"
              id="percentage"
              name="percentage"
              label={formAdditionalChargeT?.labels?.percentage}
              placeholder={formAdditionalChargeT?.placeholders?.percentage}
              value={formikAdditionalCharge.values.percentage}
              onChange={formikAdditionalCharge.handleChange}
              error={Boolean(formikAdditionalCharge.touched.percentage && formikAdditionalCharge.errors.percentage)}
              color={
                Boolean(formikAdditionalCharge.touched.percentage && formikAdditionalCharge.errors.percentage)
                  ? 'error'
                  : 'primary'
              }
              helperText={
                formikAdditionalCharge.touched.percentage && (formikAdditionalCharge.errors.percentage as string)
              }
              disabled={formikAdditionalCharge.isSubmitting}
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
              label={formAdditionalChargeT?.labels?.currency}
              // placeholder={formAdditionalChargeT?.placeholders?.currency}
              value={formikAdditionalCharge.values.currency}
              onChange={formikAdditionalCharge.handleChange}
              error={Boolean(formikAdditionalCharge.touched.currency && formikAdditionalCharge.errors.currency)}
              color={
                Boolean(formikAdditionalCharge.touched.currency && formikAdditionalCharge.errors.currency)
                  ? 'error'
                  : 'primary'
              }
              helperText={formikAdditionalCharge.touched.currency && (formikAdditionalCharge.errors.currency as string)}
              disabled={formikAdditionalCharge.isSubmitting}
            />
            <MoneyField
              fullWidth
              required
              type="text"
              decimalScale={2}
              decimalSeparator="."
              thousandSeparator=","
              prefix={`${currencies[formikAdditionalCharge.values.currency]?.symbol || ''} `}
              id="amount"
              name="amount"
              label={formAdditionalChargeT?.labels?.amount}
              placeholder={formAdditionalChargeT?.placeholders?.amount}
              value={formikAdditionalCharge.values.amount}
              onChange={formikAdditionalCharge.handleChange}
              error={Boolean(formikAdditionalCharge.touched.amount && formikAdditionalCharge.errors.amount)}
              color={
                Boolean(formikAdditionalCharge.touched.amount && formikAdditionalCharge.errors.amount)
                  ? 'error'
                  : 'primary'
              }
              helperText={formikAdditionalCharge.touched.amount && (formikAdditionalCharge.errors.amount as string)}
              disabled={formikAdditionalCharge.isSubmitting}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              color="secondary"
              onClick={() => setAdditionalChargeOpen(false)}
              disabled={formikAdditionalCharge.isSubmitting}>
              {textT?.btnCancel}
            </Button>
            <Button type="submit" variant="text" color="primary" loading={formikAdditionalCharge.isSubmitting}>
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
              // placeholder={formPaymentT?.placeholders?.currency}
              value={formikPayment.values.currency}
              onChange={formikPayment.handleChange}
              error={Boolean(formikPayment.touched.currency && formikPayment.errors.currency)}
              color={Boolean(formikPayment.touched.currency && formikPayment.errors.currency) ? 'error' : 'primary'}
              helperText={formikPayment.touched.currency && (formikPayment.errors.currency as string)}
              disabled={formikPayment.isSubmitting}
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
              disabled={formikPayment.isSubmitting}
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
              disabled={formikPayment.isSubmitting}
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
                disabled={formikPayment.isSubmitting}
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
                disabled={formikPayment.isSubmitting}
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

      {/* Success dialog */}
      <Dialog
        open={successState.open}
        onClose={() => {}} // disable close on outside click
        aria-labelledby="dialog-success-title"
        maxWidth="xs"
        fullWidth>
        <DialogTitle id="dialog-success-title">{textT?.dialogSuccess?.title}</DialogTitle>
        <DialogContent dividers className="flex flex-col gap-6">
          <Typography variant="h4" className="text-center">
            {textT?.dialogSuccess?.changeAmount}{' '}
            {formatMoney(successState.changeAmountCRC, `${currencies[Currency.CRC].symbol} `)}
          </Typography>
          <Stack direction="column" spacing={2}>
            {successState.id && (
              <Button
                LinkComponent={Link}
                variant="contained"
                color="primary"
                href={`/print/invoice/${successState.id}?or=1`}
                target="_blank">
                {textT?.dialogSuccess?.printTicket}
              </Button>
            )}
            {successState.id && (
              <Button
                LinkComponent={Link}
                variant="contained"
                color="secondary"
                href={`/invoices/view/${successState.id}`}
                target="_blank">
                {textT?.dialogSuccess?.viewInvoice}
              </Button>
            )}
            <Button variant="outlined" color="primary" onClick={handleCloseSuccess}>
              {textT?.dialogSuccess?.newInvoice}
            </Button>
          </Stack>
        </DialogContent>
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

export default BillingCC;
