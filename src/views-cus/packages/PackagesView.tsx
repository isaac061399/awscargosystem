'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

import moment from 'moment';

// MUI Imports
import {
  Alert,
  Box,
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
import InfoRow from '@/components/custom/InfoRow';

// Helpers Imports
// import { requestDeleteOrderProduct, requestEditOrder, requestNewOrder } from '@helpers/request';
import { useConfig } from '@/components/ConfigProvider';

import { currencies } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';
import { calculateTaxes, convertCRC } from '@/helpers/calculations';

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

const PackagesView = ({ packageObj }: { packageObj: any }) => {
  const { configuration } = useConfig();
  const sellingExchangeRate = configuration?.selling_exchange_rate ?? 0;
  const ivaPercentage = configuration?.iva_percentage ?? 0;

  const { t } = useTranslation();
  const textT: any = useMemo(() => t('packages-view:text', { returnObjects: true, default: {} }), [t]);
  // const formT: any = useMemo(() => t('packages-view:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

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

  const statusChip: any = {
    label: labelsT?.packageStatus?.[packageObj.status] || 'Unknown',
    color: statusColors[packageObj.status] || 'info'
  };

  const paymentStatusChip: any = {
    label: labelsT?.paymentStatus?.[packageObj.payment_status] || 'Unknown',
    color: paymentStatusColors[packageObj.payment_status] || 'info'
  };

  const packageTotal = calculateTaxes(packageObj.billing_amount, ivaPercentage);
  const packageTotalCRC = {
    subtotal: convertCRC(packageTotal.subtotal, sellingExchangeRate),
    total: convertCRC(packageTotal.total, sellingExchangeRate)
  };

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
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack>
                      <div className="flex items-center gap-1">
                        <Typography variant="overline" color="text.secondary">
                          {textT?.subtotalLabel}:
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {formatMoney(packageTotal.subtotal, `${currencies.USD.symbol} `)}
                          {' | '}
                          {formatMoney(packageTotalCRC.subtotal, `${currencies.CRC.symbol} `)}
                        </Typography>
                      </div>
                      <div className="flex items-center gap-1">
                        <Typography variant="overline" color="text.secondary">
                          {textT?.totalLabel}:
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {formatMoney(packageTotal.total, `${currencies.USD.symbol} `)}
                          {' | '}
                          {formatMoney(packageTotalCRC.total, `${currencies.CRC.symbol} `)}
                        </Typography>
                      </div>
                    </Stack>
                  </Grid>

                  {/* Package status */}
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
                </Grid>
                <Divider sx={{ mt: 5 }} />
              </CardContent>

              <CardContent>
                {/* Header */}
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  justifyContent="space-between"
                  sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {textT?.trackingLabel}: {packageObj.tracking}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${textT?.dateLabel}: ${moment(packageObj.created_at).format(textT?.dateFormat)}`}
                    />
                  </Stack>
                </Stack>

                {/* Cards */}
                <Grid container spacing={5}>
                  {/* Client Info */}
                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                    <Card sx={{ flexGrow: 1 }}>
                      <CardHeader title={textT?.clientInfo?.title} />
                      <CardContent>
                        <Stack spacing={1.25}>
                          <InfoRow
                            label={textT?.clientInfo?.mailbox}
                            value={`${packageObj.client?.office?.mailbox_prefix}${packageObj.client?.id}`}
                          />
                          <InfoRow label={textT?.clientInfo?.name} value={packageObj.client?.full_name} />
                          <InfoRow
                            label={textT?.clientInfo?.identification}
                            value={packageObj.client?.identification}
                          />
                          <InfoRow label={textT?.clientInfo?.email} value={packageObj.client?.email} />
                          <InfoRow
                            label={textT?.clientInfo?.profile}
                            value={
                              <Link
                                href={`/clients/edit/${packageObj.client?.id}`}
                                target="_blank"
                                className="underline">
                                {textT?.clientInfo?.viewClient}
                              </Link>
                            }
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Package Info */}
                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                    <Card sx={{ flexGrow: 1 }}>
                      <CardHeader title={textT?.packageInfo?.title} />
                      <CardContent>
                        <Stack spacing={1.25}>
                          <InfoRow
                            label={textT?.packageInfo?.courierCompany}
                            value={packageObj.courier_company ?? '—'}
                          />
                          <InfoRow label={textT?.packageInfo?.purchasePage} value={packageObj.purchase_page ?? '—'} />
                          <InfoRow label={textT?.packageInfo?.price} value={packageObj.price} />
                          <Divider />
                          <InfoRow label={textT?.packageInfo?.description} value={packageObj.description ?? '—'} />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Billing */}
                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                    <Card sx={{ flexGrow: 1 }}>
                      <CardHeader title={textT?.billingInfo?.title} />
                      <CardContent>
                        <Stack spacing={1.25}>
                          <InfoRow label={textT?.billingInfo?.weight} value={packageObj.billing_weight} />
                          <InfoRow
                            label={textT?.billingInfo?.poundFee}
                            value={formatMoney(packageObj.billing_pound_fee, `${currencies.USD.symbol} `)}
                          />
                          <Divider />
                          <InfoRow
                            label={textT?.billingInfo?.subtotal}
                            value={
                              <Typography component="span" fontWeight={600}>
                                {formatMoney(packageTotal.subtotal, `${currencies.USD.symbol} `)}
                              </Typography>
                            }
                          />
                          <InfoRow
                            label={textT?.billingInfo?.total}
                            value={
                              <Typography component="span" fontWeight={600}>
                                {formatMoney(packageTotal.total, `${currencies.USD.symbol} `)}
                              </Typography>
                            }
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Location */}
                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                    <Card sx={{ flexGrow: 1 }}>
                      <CardHeader title={textT?.locationInfo?.title} />
                      <CardContent>
                        <Stack spacing={1.25}>
                          <InfoRow label={textT?.locationInfo?.shelf} value={packageObj.location_shelf} />
                          <InfoRow label={textT?.locationInfo?.row} value={packageObj.location_row} />
                          <Divider />
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

export default PackagesView;
