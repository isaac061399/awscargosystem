'use client';

// React Imports
import { useMemo, useState } from 'react';

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
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import InfoRow from '@/components/custom/InfoRow';

// Helpers Imports
import { requestCancelInvoice } from '@/helpers/request';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

import { Currency, InvoiceStatus } from '@/prisma/generated/enums';
import { bankAccounts, currencies, paymentConditionsDays } from '@/libs/constants';
import { formatMoney } from '@/libs/utils';

const defaultAlertState = { open: false, type: 'success', message: '' };

const statusColors: any = {
  PENDING: 'warning',
  PAID: 'success',
  CANCELED: 'error'
};

const InvoicesView = ({ invoice }: { invoice: any }) => {
  const router = useRouter();
  const { data: admin } = useAdmin();
  const canCancel = hasAllPermissions('invoices.cancel', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('invoices-view:text', { returnObjects: true, default: {} }), [t]);
  // const formT: any = useMemo(() => t('invoices-view:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [cancelState, setCancelState] = useState({ open: false, loading: false });

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

  const handleCancelOpen = () => {
    setCancelState({ open: true, loading: false });
  };

  const handleCancelClose = () => {
    setCancelState({ open: false, loading: false });
  };

  const handleCancel = async () => {
    setAlertState({ ...defaultAlertState });
    setCancelState({ ...cancelState, loading: true });

    const result = await requestCancelInvoice(invoice.id || 0, i18n.language);

    handleCancelClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });

      return;
    }

    setAlertState({ open: true, type: 'success', message: textT?.cancelDialog?.successMessage });
    setTimeout(() => {
      setAlertState({ ...defaultAlertState });
    }, 5000);

    router.refresh();
  };

  const statusChip: any = {
    label: labelsT?.invoiceStatus?.[invoice.status] || 'Unknown',
    color: statusColors[invoice.status] || 'info'
  };

  const isCancelable = invoice.status !== InvoiceStatus.CANCELED && canCancel;

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
                  {`${textT?.title} #${invoice.consecutive}`}
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
            {alertState.open && <Alert severity={alertState.type}>{alertState.message}</Alert>}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Stack spacing={2}>
              {/* Header */}
              <Paper className="p-4 md:p-6" elevation={1}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Typography variant="h5" fontWeight={700}>
                      {labelsT?.invoiceType?.[invoice.type]} #{invoice.consecutive}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {textT?.numericKeyLabel}: {invoice.numeric_key}
                    </Typography>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Chip label={invoice.cash_register?.office?.name} color="secondary" />
                    <Chip label={statusChip.label} color={statusChip.color} />
                  </div>
                </div>

                <Divider className="my-4" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Client Info */}
                  <Stack spacing={1.25}>
                    <Typography variant="body1" color="text.secondary">
                      {textT?.clientInfo?.title}
                    </Typography>
                    <Divider />
                    <InfoRow
                      label={textT?.clientInfo?.mailbox}
                      value={`${invoice.client?.office?.mailbox_prefix}${invoice.client?.id}`}
                    />
                    <InfoRow label={textT?.clientInfo?.name} value={invoice.client?.full_name} />
                    <InfoRow label={textT?.clientInfo?.identification} value={invoice.client?.identification} />
                    <InfoRow label={textT?.clientInfo?.email} value={invoice.client?.email} />
                    <InfoRow
                      label={textT?.clientInfo?.profile}
                      value={
                        <Link href={`/clients/edit/${invoice.client?.id}`} target="_blank" className="underline">
                          {textT?.clientInfo?.viewClient}
                        </Link>
                      }
                    />
                  </Stack>

                  {/* Payment Info */}
                  <Stack spacing={1.25}>
                    <Typography variant="body1" color="text.secondary">
                      {textT?.paymentInfo?.title}
                    </Typography>
                    <Divider />
                    <InfoRow
                      label={textT?.paymentInfo?.paymentCondition}
                      value={labelsT?.invoicePaymentCondition?.[invoice.payment_condition] ?? '—'}
                    />
                    <InfoRow
                      label={textT?.paymentInfo?.currency}
                      value={labelsT?.currency?.[invoice.currency] ?? '—'}
                    />
                    <InfoRow
                      label={textT?.paymentInfo?.exchangeRate}
                      value={`${formatMoney(invoice.selling_exchange_rate, `${currencies[Currency.CRC].symbol} `)} | ${formatMoney(invoice.buying_exchange_rate, `${currencies[Currency.CRC].symbol} `)}`}
                    />
                    <InfoRow
                      label={textT?.paymentInfo?.paymentMethod}
                      value={labelsT?.paymentMethod?.[invoice.payment_method] ?? '—'}
                    />
                    <InfoRow
                      label={textT?.paymentInfo?.cashChange}
                      value={formatMoney(invoice.cash_change, `${currencies[Currency.CRC].symbol} `)}
                    />
                  </Stack>

                  {/* Dates Info */}
                  <Stack spacing={1.25}>
                    <Typography variant="body1" color="text.secondary">
                      {textT?.datesInfo?.title}
                    </Typography>
                    <Divider />
                    <InfoRow
                      label={textT?.datesInfo?.issueDate}
                      value={moment(invoice.created_at).format(textT?.dateFormat)}
                    />
                    <InfoRow
                      label={textT?.datesInfo?.dueDate}
                      value={moment(invoice.created_at)
                        .add(
                          paymentConditionsDays[invoice.payment_condition as keyof typeof paymentConditionsDays],
                          'days'
                        )
                        .format(textT?.dateFormat)}
                    />
                    {invoice.cancelled_at && (
                      <InfoRow
                        label={textT?.datesInfo?.cancelDate}
                        value={moment(invoice.cancelled_at).format(textT?.dateFormat)}
                      />
                    )}
                    {invoice.cancelled_by && (
                      <InfoRow
                        label={textT?.datesInfo?.cancelBy}
                        value={
                          <Link
                            href={`/administrators/edit/${invoice.cancelled_by?.id}`}
                            target="_blank"
                            className="underline">
                            {invoice.cancelled_by?.email}
                          </Link>
                        }
                      />
                    )}
                  </Stack>
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<i className="ri-printer-line"></i>}
                    LinkComponent={Link}
                    href={`/print/invoice/${invoice.id}`}
                    target="_blank">
                    {textT?.btnPrint}
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<i className="ri-file-pdf-2-line"></i>}
                    // onClick={onDownloadPdf}
                  >
                    {textT?.btnPDF}
                  </Button>

                  {isCancelable && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<i className="ri-close-line"></i>}
                      onClick={() => handleCancelOpen()}>
                      {textT?.btnCancel}
                    </Button>
                  )}
                </div>
              </Paper>

              {/* Lines */}
              <Paper className="p-4 md:p-6" elevation={1}>
                <Typography variant="h6" fontWeight={700} className="mb-3">
                  {textT?.lines?.title}
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{textT?.lines?.description}</TableCell>
                      <TableCell align="right">{textT?.lines?.quantity}</TableCell>
                      <TableCell align="right">{textT?.lines?.unitPrice}</TableCell>
                      <TableCell align="right">{textT?.lines?.totalPrice}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.invoice_lines?.map((l: any, index: number) => {
                      let desc = '';
                      let desc2 = '';
                      let href = '#';
                      if (l.package) {
                        desc = `${textT?.lines?.package}: ${textT?.lines?.tracking} ${l.package.tracking}`;
                        desc2 = l.package.description;
                        href = `/packages/view/${l.package.id}`;
                      } else if (l.order_product) {
                        desc = `${textT?.lines?.orderProduct}: ${textT?.lines?.tracking} ${l.order_product.tracking}`;
                        desc2 = `${l.order_product.quantity} x ${l.order_product.name}`;
                        href = `/orders/edit/${l.order_product.order_id}`;
                      } else if (l.product) {
                        desc = `${textT?.lines?.product}: ${textT?.lines?.code} ${l.product.code}`;
                        desc2 = l.product.name;
                        href = `/products/edit/${l.product.id}`;
                      }

                      return (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Link href={href} target="_blank" className="underline">
                                <span className="font-medium">{desc}</span>
                              </Link>
                              <span className="text-xs text-gray-500">{desc2}</span>
                            </div>
                          </TableCell>
                          <TableCell align="right">{l.quantity}</TableCell>
                          <TableCell align="right">
                            {formatMoney(l.unit_price, `${currencies[l.currency].symbol} `)}
                          </TableCell>
                          <TableCell align="right">
                            {formatMoney(l.total, `${currencies[l.currency].symbol} `)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <Divider className="my-4" />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div />
                  <div />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{textT?.lines?.subtotal}</span>
                      <span className="text-sm font-semibold">
                        {formatMoney(invoice.subtotal, `${currencies[invoice.currency].symbol} `)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{textT?.lines?.tax}</span>
                      <span className="text-sm font-semibold">
                        {formatMoney(invoice.tax, `${currencies[invoice.currency].symbol} `)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base font-bold">{textT?.lines?.total}</span>
                      <span className="text-base font-bold">
                        {formatMoney(invoice.total, `${currencies[invoice.currency].symbol} `)}
                      </span>
                    </div>
                  </div>
                </div>
              </Paper>

              {/* Payments */}
              <Paper className="p-4 md:p-6" elevation={1}>
                <Typography variant="h6" fontWeight={700} className="mb-3">
                  {textT?.payments?.title}
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{textT?.payments?.method}</TableCell>
                      <TableCell>{textT?.payments?.ref}</TableCell>
                      <TableCell>{textT?.payments?.refBank}</TableCell>
                      <TableCell align="right">{textT?.payments?.amount}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.invoice_payments.map((p: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{labelsT?.paymentMethod[p.payment_method]}</TableCell>
                        <TableCell>{p.ref || '-'}</TableCell>
                        <TableCell>{bankAccounts[p.ref_bank as keyof typeof bankAccounts] || '-'}</TableCell>
                        <TableCell align="right">
                          {formatMoney(p.amount, `${currencies[p.currency].symbol} `)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              {/* Cancel dialog */}
              <Dialog
                open={cancelState.open}
                onClose={handleCancelClose}
                aria-labelledby="cancel-dialog-title"
                aria-describedby="cancel-dialog-description">
                <DialogTitle id="cancel-dialog-title">{textT?.cancelDialog?.title}</DialogTitle>
                <DialogContent dividers>
                  <DialogContentText id="cancel-dialog-description">{textT?.cancelDialog?.message}</DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button variant="text" color="secondary" onClick={handleCancelClose} disabled={cancelState.loading}>
                    {textT?.cancelDialog?.btnCancel}
                  </Button>
                  <Button variant="text" color="primary" onClick={handleCancel} loading={cancelState.loading}>
                    {textT?.cancelDialog?.btnConfirm}
                  </Button>
                </DialogActions>
              </Dialog>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </DashboardLayout>
  );
};

export default InvoicesView;
