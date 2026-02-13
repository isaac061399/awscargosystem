'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
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
  Divider,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import MoneyField from '@/components/MoneyField';

// Helpers Imports
import { requestOrdersCalculator } from '@helpers/request';
// import { useConfig } from '@/components/ConfigProvider';

import { currencies } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';

const defaultAlertState = { open: false, type: 'success', message: '' };

const OrdersCalculator = () => {
  // const { configuration } = useConfig();
  // const sellingExchangeRate = configuration?.selling_exchange_rate ?? 0;

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('orders-calculator:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('orders-calculator:form', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [result, setResult] = useState({
    quantity: 0,
    priceTotal: 0,
    weightTotal: 0,
    servicePrice: 0,
    subtotal: 0,
    taxes: 0,
    total: 0
  });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        quantity: '',
        unit_price: '',
        unit_weight: ''
      }),
      []
    ),
    validationSchema: yup.object({
      quantity: yup.number().integer(formT?.errors?.invalidInteger).required(formT?.errors?.quantity),
      unit_price: yup.number().required(formT?.errors?.unit_price),
      unit_weight: yup.number().required(formT?.errors?.unit_weight)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const result = await requestOrdersCalculator(values, i18n.language);
        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setResult({ quantity: values.quantity, ...result.data });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex flex-col sm:flex-row sm:justify-between justify-start items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Typography variant="h3" className="flex items-center gap-1">
                  {textT?.title}
                </Typography>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"></div>
            </div>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card>
              {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}
              <CardContent>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 4 }} className="flex flex-col gap-4">
                    <TextField
                      fullWidth
                      required
                      type="number"
                      id="quantity"
                      name="quantity"
                      label={formT?.labels?.quantity}
                      placeholder={formT?.placeholders?.quantity}
                      value={formik.values.quantity}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.quantity && formik.errors.quantity)}
                      color={Boolean(formik.touched.quantity && formik.errors.quantity) ? 'error' : 'primary'}
                      helperText={formik.touched.quantity && formik.errors.quantity}
                      disabled={formik.isSubmitting}
                    />

                    <MoneyField
                      fullWidth
                      required
                      type="text"
                      decimalScale={2}
                      decimalSeparator="."
                      thousandSeparator=","
                      prefix={`${currencies.USD.symbol} `}
                      id="unit_price"
                      name="unit_price"
                      label={formT?.labels?.unit_price}
                      placeholder={formT?.placeholders?.unit_price}
                      value={formik.values.unit_price}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.unit_price && formik.errors.unit_price)}
                      color={Boolean(formik.touched.unit_price && formik.errors.unit_price) ? 'error' : 'primary'}
                      helperText={formik.touched.unit_price && (formik.errors.unit_price as string)}
                      disabled={formik.isSubmitting}
                    />

                    <TextField
                      fullWidth
                      required
                      type="number"
                      id="unit_weight"
                      name="unit_weight"
                      label={formT?.labels?.unit_weight}
                      placeholder={formT?.placeholders?.unit_weight}
                      value={formik.values.unit_weight}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.unit_weight && formik.errors.unit_weight)}
                      color={Boolean(formik.touched.unit_weight && formik.errors.unit_weight) ? 'error' : 'primary'}
                      helperText={formik.touched.unit_weight && (formik.errors.unit_weight as string)}
                      disabled={formik.isSubmitting}
                    />

                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      loading={formik.isSubmitting}
                      startIcon={<i className="ri-calculator-line" />}>
                      {textT?.btnCalculate}
                    </Button>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card className="w-full max-w-xl rounded-2xl shadow-sm">
                      <CardContent className="p-5">
                        {/* Header */}
                        <Box className="flex items-start justify-between gap-4">
                          <Typography variant="h6" className="font-semibold">
                            {textT?.result}
                          </Typography>

                          {/* Info */}
                          <Box className="flex items-end gap-2">
                            <Chip size="small" label={`${textT?.quantity}: ${result.quantity}`} variant="outlined" />
                            <Chip
                              size="small"
                              label={`${textT?.weightTotal}: ${result.weightTotal} lb`}
                              variant="outlined"
                            />
                          </Box>
                        </Box>

                        <Divider className="my-3" />

                        {/* Content */}
                        <Stack className="mt-2">
                          <Row
                            label={textT?.priceTotal}
                            value={formatMoney(result.priceTotal, `${currencies.USD.symbol} `)}
                          />
                          <Row
                            label={textT?.servicePrice}
                            value={formatMoney(result.servicePrice, `${currencies.USD.symbol} `)}
                          />

                          <Divider className="my-1" />

                          <Row
                            label={textT?.subtotal}
                            value={formatMoney(result.subtotal, `${currencies.USD.symbol} `)}
                          />
                          <Row label={textT?.taxes} value={formatMoney(result.taxes, `${currencies.USD.symbol} `)} />

                          <Divider className="my-1" />

                          <Row
                            label={textT?.total}
                            value={formatMoney(result.total, `${currencies.USD.symbol} `)}
                            strong
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </DashboardLayout>
  );
};

const Row = ({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) => (
  <Box className="flex items-center justify-between py-1">
    <Typography
      variant={strong ? 'subtitle1' : 'body2'}
      className={strong ? 'font-semibold text-slate-900' : 'text-slate-600'}>
      {label}
    </Typography>
    <Typography
      variant={strong ? 'subtitle1' : 'body2'}
      className={strong ? 'font-semibold text-slate-900' : 'text-slate-700'}>
      {value}
    </Typography>
  </Box>
);

export default OrdersCalculator;
