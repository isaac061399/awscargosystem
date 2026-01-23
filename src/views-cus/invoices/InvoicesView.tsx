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
  PENDING: 'warning',
  PAID: 'success',
  CANCELED: 'error'
};

const InvoicesView = ({ invoice }: { invoice: any }) => {
  const { configuration } = useConfig();
  const sellingExchangeRate = configuration?.selling_exchange_rate ?? 0;
  const ivaPercentage = configuration?.iva_percentage ?? 0;

  const { t } = useTranslation();
  const textT: any = useMemo(() => t('invoices-view:text', { returnObjects: true, default: {} }), [t]);
  // const formT: any = useMemo(() => t('invoices-view:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        notes: invoice ? invoice.notes : null
      }),
      [invoice]
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
      //       router.push(`/invoices/edit/${result.id}`);
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
    label: labelsT?.invoiceStatus?.[invoice.status] || 'Unknown',
    color: statusColors[invoice.status] || 'info'
  };

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex flex-col sm:flex-row sm:justify-between justify-start items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Typography variant="h3" className="flex items-center gap-1">
                  <IconButton className="p-1" color="default" LinkComponent={Link} href="/invoices">
                    <i className="ri-arrow-left-s-line text-4xl" />
                  </IconButton>
                  {`${textT?.title} ${invoice.tracking}`}
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
                  <Grid size={{ xs: 12, md: 4 }}></Grid>

                  {/* Invoice status */}
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
                      {textT?.trackingLabel}: {invoice.tracking}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${textT?.dateLabel}: ${moment(invoice.created_at).format(textT?.dateFormat)}`}
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
                            value={`${invoice.client?.office?.mailbox_prefix}${invoice.client?.id}`}
                          />
                          <Divider />
                          <InfoRow label={textT?.clientInfo?.name} value={invoice.client?.full_name} />
                          <InfoRow label={textT?.clientInfo?.identification} value={invoice.client?.identification} />
                          <InfoRow label={textT?.clientInfo?.email} value={invoice.client?.email} />
                          <InfoRow label={textT?.clientInfo?.office} value={invoice.client?.office?.name} />
                          <Divider />
                          <InfoRow
                            label={textT?.clientInfo?.profile}
                            value={
                              invoice.client?.id ? (
                                <Link href={`/clients/edit/${invoice.client.id}`} target="_blank" className="underline">
                                  {textT?.clientInfo?.viewClient}
                                </Link>
                              ) : (
                                '—'
                              )
                            }
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Invoice Info */}
                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                    <Card sx={{ flexGrow: 1 }}>
                      <CardHeader title={textT?.invoiceInfo?.title} />
                      <CardContent>
                        <Stack spacing={1.25}>
                          <InfoRow label={textT?.invoiceInfo?.courierCompany} value={invoice.courier_company ?? '—'} />
                          <InfoRow label={textT?.invoiceInfo?.purchasePage} value={invoice.purchase_page ?? '—'} />
                          <InfoRow label={textT?.invoiceInfo?.price} value={invoice.price} />
                          <Divider />
                          <InfoRow label={textT?.invoiceInfo?.description} value={invoice.description ?? '—'} />
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
                          <InfoRow label={textT?.billingInfo?.weight} value={invoice.billing_weight} />
                          <InfoRow
                            label={textT?.billingInfo?.poundFee}
                            value={formatMoney(invoice.billing_pound_fee, `${currencies.USD.symbol} `)}
                          />
                          <Divider />
                          <InfoRow
                            label={textT?.billingInfo?.subtotal}
                            value={
                              <Typography component="span" fontWeight={600}>
                                {/* {formatMoney(invoiceTotal.subtotal, `${currencies.USD.symbol} `)} */}
                              </Typography>
                            }
                          />
                          <InfoRow
                            label={textT?.billingInfo?.total}
                            value={
                              <Typography component="span" fontWeight={600}>
                                {/* {formatMoney(invoiceTotal.total, `${currencies.USD.symbol} `)} */}
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
                          <InfoRow label={textT?.locationInfo?.shelf} value={invoice.location_shelf} />
                          <InfoRow label={textT?.locationInfo?.row} value={invoice.location_row} />
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

export default InvoicesView;
