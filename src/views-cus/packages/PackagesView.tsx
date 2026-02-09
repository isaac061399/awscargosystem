'use client';

// React Imports
import { useEffect, useMemo, useRef, useState } from 'react';

// Next Imports
import { useRouter } from 'next/navigation';
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
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import InfoRow from '@/components/custom/InfoRow';

// Helpers Imports
import { requestEditPackage } from '@helpers/request';
import { useConfig } from '@/components/ConfigProvider';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

import { currencies } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';
import { calculateShippingPrice, calculateTaxes, convertCRC } from '@/helpers/calculations';
import { PaymentStatus } from '@/prisma/generated/browser';

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
  const router = useRouter();

  const { data: admin } = useAdmin();
  const canEdit = hasAllPermissions('packages.edit', admin.permissions);

  const { configuration } = useConfig();
  const sellingExchangeRate = configuration?.selling_exchange_rate ?? 0;
  const ivaPercentage = configuration?.iva_percentage ?? 0;

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('packages-view:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('packages-view:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [editOpen, setEditOpen] = useState(false);
  const [price, setPrice] = useState<number>(packageObj.billing_amount || 0);

  const weightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        billing_weight: packageObj.billing_weight || ''
      }),
      [packageObj]
    ),
    validationSchema: yup.object({
      billing_weight: yup.number().required(formT?.errors?.billing_weight)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const result = await requestEditPackage(packageObj.id, values, i18n.language);

        setEditOpen(false);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        router.refresh();
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        setEditOpen(false);

        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  // billing_weight field change effect
  useEffect(() => {
    if (formik.values.billing_weight && formik.values.billing_weight.toString().length > 0) {
      if (weightTimeoutRef.current) {
        clearTimeout(weightTimeoutRef.current);
      }

      weightTimeoutRef.current = setTimeout(() => {
        const amount = calculateShippingPrice(formik.values.billing_weight, packageObj.billing_pound_fee || 0);

        setPrice(amount);
      }, 500);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.billing_weight]);

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

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {packageObj.payment_status === PaymentStatus.PENDING && (
                <Button
                  LinkComponent={Link}
                  href={`/billing?client=${packageObj.client.id}`}
                  size="small"
                  type="button"
                  variant="contained"
                  color="success"
                  startIcon={<i className="ri-file-text-line" />}>
                  {textT?.btnBilling}
                </Button>
              )}

              {canEdit && (
                <Button
                  size="small"
                  type="button"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting}
                  startIcon={<i className="ri-file-edit-line" />}
                  onClick={() => setEditOpen(true)}>
                  {textT?.btnEdit}
                </Button>
              )}
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
                      {formatMoney(packageTotal.subtotal, `${currencies.USD.symbol} `)}
                      {' | '}
                      {formatMoney(packageTotalCRC.subtotal, `${currencies.CRC.symbol} `)}
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
                      {formatMoney(packageTotal.total, `${currencies.USD.symbol} `)}
                      {' | '}
                      {formatMoney(packageTotalCRC.total, `${currencies.CRC.symbol} `)}
                    </Typography>
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
                        <InfoRow label={textT?.clientInfo?.identification} value={packageObj.client?.identification} />
                        <InfoRow label={textT?.clientInfo?.email} value={packageObj.client?.email} />
                        <InfoRow
                          label={textT?.clientInfo?.profile}
                          value={
                            <Link href={`/clients/edit/${packageObj.client?.id}`} target="_blank" className="underline">
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
                        <InfoRow label={textT?.packageInfo?.courierCompany} value={packageObj.courier_company ?? '—'} />
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

      {canEdit && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          aria-labelledby="dialog-edit-title"
          maxWidth="sm"
          fullWidth>
          <form noValidate onSubmit={formik.handleSubmit}>
            <DialogTitle id="dialog-edit-title">{textT?.dialogEditTitle}</DialogTitle>
            <DialogContent dividers className="flex flex-col gap-6">
              <TextField
                fullWidth
                required
                type="number"
                id="billing_weight"
                name="billing_weight"
                label={formT?.labels?.billing_weight}
                placeholder={formT?.placeholders?.billing_weight}
                value={formik.values.billing_weight}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.billing_weight && formik.errors.billing_weight)}
                color={Boolean(formik.touched.billing_weight && formik.errors.billing_weight) ? 'error' : 'primary'}
                helperText={formik.touched.billing_weight && (formik.errors.billing_weight as string)}
                disabled={formik.isSubmitting}
              />

              <Typography variant="body1" fontWeight={600} gutterBottom>
                {`${textT?.priceLabel}: ${formatMoney(price, `${currencies.USD.symbol} `)}`}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                variant="text"
                color="secondary"
                onClick={() => setEditOpen(false)}
                disabled={formik.isSubmitting}>
                {textT?.btnCancel}
              </Button>
              <Button type="submit" variant="text" color="primary" loading={formik.isSubmitting}>
                {textT?.btnSave}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default PackagesView;
