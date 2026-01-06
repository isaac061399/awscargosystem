'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useTranslation } from 'react-i18next';
import moment from 'moment';

// MUI Imports
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

// Utils Imports
import { CashRegisterStatus } from '@/prisma/generated/enums';
import { formatMoney } from '@libs/utils';
import { requestReopenCashRegister } from '@/helpers/request';
import { currencies } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const getCashDetail = (options: { [key: string]: string }, data: { [key: string]: number }) => {
  const detail = [] as { title: string; value: number }[];

  Object.keys(options).forEach((key) => {
    detail.push({ title: options[key], value: data[key] || 0 });
  });

  return detail;
};

const CashRegistersView = ({ cashRegister }: { cashRegister: any }) => {
  const { data: admin } = useAdmin();
  const canReopen = hasAllPermissions('cash-registers.reopen', admin.permissions);

  const router = useRouter();
  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('cash-registers-view:text', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [reopenState, setReopenState] = useState({ open: false, loading: false });

  const isClosed = cashRegister.status === CashRegisterStatus.CLOSED;

  const handleReopenOpen = () => {
    setReopenState((prevState: any) => ({ ...prevState, open: true }));
  };

  const handleReopenClose = () => {
    setReopenState((prevState: any) => ({ ...prevState, open: false, loading: false }));
  };

  const handleReopen = async () => {
    setAlertState({ ...defaultAlertState });
    setReopenState((prevState: any) => ({ ...prevState, loading: true }));

    const result = await requestReopenCashRegister(cashRegister.id, i18n.language);

    handleReopenClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      router.refresh();
    }
  };

  const handlePrintTicket = async () => {
    const pdfUrl = `/api/cash-registers/${cashRegister.id}/ticket`;
    const win = window.open(pdfUrl, '_blank');

    if (win) {
      // Auto print when the new tab loads
      win.onload = () => {
        win.print();
      };
    }
  };

  let totalEntries = 0;
  let totalOutflows = 0;
  let totalCashReported = 0;
  let totalCash = 0;
  let totalDifference = 0;
  let resultIcon = 'checkbox-circle-fill';
  let resultColor = 'success';
  let cashDetail = [] as { title: string; value: number }[];

  if (isClosed) {
    totalEntries =
      cashRegister.cash_amount + cashRegister.sinpe_amount + cashRegister.transfer_amount + cashRegister.card_amount;
    totalOutflows =
      cashRegister.cash_outflows +
      cashRegister.sinpe_outflows +
      cashRegister.transfer_outflows +
      cashRegister.card_outflows;

    totalCashReported = cashRegister.cash_reported - cashRegister.cash_balance;
    totalCash = cashRegister.cash_amount - cashRegister.cash_outflows;
    totalDifference = totalCashReported - totalCash;

    if (totalDifference < 0) {
      resultIcon = 'arrow-down-circle-fill';
      resultColor = 'error';
    } else if (totalDifference > 0) {
      resultIcon = 'arrow-up-circle-fill';
      resultColor = 'warning';
    }

    cashDetail = getCashDetail(
      labelsT?.cashMoney || {},
      cashRegister.cash_reported_data ? JSON.parse(cashRegister.cash_reported_data) : {}
    );
  }

  const lines: { [key: string]: any } = {};
  cashRegister.lines.forEach((line: any) => {
    lines[line.currency] = line;
  });

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between mb-3">
            <Typography variant="h3" className="flex items-center gap-1">
              <IconButton className="p-1" color="default" LinkComponent={Link} href="/cash-registers">
                <i className="ri-arrow-left-s-line text-4xl" />
              </IconButton>
              {textT?.title?.replace('{{ name }}', cashRegister.administrator.full_name)}
            </Typography>
            <div className="flex items-center gap-2"></div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card>
            {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}

            <CardContent>
              <Grid container spacing={5}>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Card variant="outlined" className="h-full shadow">
                    <CardHeader
                      title={textT?.admin?.title}
                      sx={{ py: 2 }}
                      action={
                        <Button
                          size="small"
                          LinkComponent={Link}
                          href={`/administrators/edit/${cashRegister.administrator.id}`}
                          target="_blank"
                          endIcon={<i className="ri-external-link-fill" />}>
                          {textT?.btnView}
                        </Button>
                      }
                    />

                    <Divider />

                    <CardContent>
                      <Typography variant="body1">
                        <strong>{textT?.admin?.name}:</strong> {cashRegister.administrator.full_name}
                      </Typography>
                      <Typography variant="body1">
                        <strong>{textT?.admin?.email}:</strong> {cashRegister.administrator.email}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {!isClosed && (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card variant="outlined" className="h-full shadow">
                      <CardHeader title={textT?.openResult?.title} sx={{ py: 2 }} />

                      <Divider />

                      <CardContent>
                        <Typography variant="body1">
                          <strong>{textT?.openResult?.openDate}:</strong>{' '}
                          {moment(cashRegister.open_date).format(textT?.dateTimeFormat)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>{textT?.openResult?.cashBalanceCRC}:</strong>{' '}
                          {formatMoney(lines['CRC']?.cash_balance || 0, `${currencies.CRC.symbol} `)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>{textT?.openResult?.cashBalanceUSD}:</strong>{' '}
                          {formatMoney(lines['USD']?.cash_balance || 0, `${currencies.USD.symbol} `)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {isClosed && (
                  <>
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <Card variant="outlined" className="h-full shadow">
                        <CardHeader
                          title={textT?.result?.title}
                          sx={{ py: 2 }}
                          action={<i className={`ri-${resultIcon} text-${resultColor}`} />}
                        />

                        <Divider />

                        <CardContent>
                          <Typography variant="body1" className="flex items-center gap-1">
                            <strong>{textT?.result?.totalCashReported}:</strong> {formatMoney(totalCashReported)}
                            <Tooltip title={textT?.result?.totalCashReportedInfo} placement="top">
                              <i className="ri-information-fill text-primary" />
                            </Tooltip>
                          </Typography>
                          <Typography variant="body1" className="flex items-center gap-1">
                            <strong>{textT?.result?.totalCash}:</strong> {formatMoney(totalCash)}
                            <Tooltip title={textT?.result?.totalCashInfo} placement="top">
                              <i className="ri-information-fill text-primary" />
                            </Tooltip>
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.result?.difference}:</strong> {formatMoney(totalDifference)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <div className="flex flex-col items-center justify-center gap-2 h-full">
                        {canReopen && (
                          <Button
                            type="button"
                            variant="contained"
                            color="secondary"
                            startIcon={<i className="ri-alert-line" />}
                            onClick={handleReopenOpen}>
                            {textT?.btnReopen}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="contained"
                          color="primary"
                          startIcon={<i className="ri-printer-line" />}
                          onClick={handlePrintTicket}>
                          {textT?.btnPrint}
                        </Button>
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                      <Card variant="outlined" className="h-full shadow">
                        <CardHeader title={textT?.detail?.title} sx={{ py: 2 }} />

                        <Divider />

                        <CardContent>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.openDate}:</strong>{' '}
                            {moment(cashRegister.open_date).format(textT?.dateTimeFormat)}
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.closeDate}:</strong>{' '}
                            {moment(cashRegister.close_date).format(textT?.dateTimeFormat)}
                          </Typography>

                          <Divider className="my-2" />

                          <Typography variant="body1">
                            <strong>{textT?.detail?.cashBalance}:</strong> {formatMoney(cashRegister.cash_balance)}
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.cashReported}:</strong> {formatMoney(cashRegister.cash_reported)}
                          </Typography>

                          <Divider className="my-2" />

                          <Typography variant="body1">
                            <strong>{textT?.detail?.cashAmount}:</strong> {formatMoney(cashRegister.cash_amount)}
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.sinpeAmount}:</strong> {formatMoney(cashRegister.sinpe_amount)}
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.transferAmount}:</strong>{' '}
                            {formatMoney(cashRegister.transfer_amount)}
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.totalAmount}:</strong> {formatMoney(totalEntries)}
                          </Typography>

                          <Divider className="my-2" />

                          <Typography variant="body1">
                            <strong>{textT?.detail?.cashOutflows}:</strong> {formatMoney(cashRegister.cash_outflows)}
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.sinpeOutflows}:</strong> {formatMoney(cashRegister.sinpe_outflows)}
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.transferOutflows}:</strong>{' '}
                            {formatMoney(cashRegister.transfer_outflows)}
                          </Typography>
                          <Typography variant="body1">
                            <strong>{textT?.detail?.totalOutflows}:</strong> {formatMoney(totalOutflows)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                      <Card variant="outlined" className="h-full shadow">
                        <CardHeader title={textT?.cashDetail?.title} sx={{ py: 2 }} />

                        <Divider />

                        <CardContent>
                          {cashDetail.map((item, i) => (
                            <Typography variant="body1" key={i}>
                              <strong>{item.title}:</strong> {item.value}
                            </Typography>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                      <Card variant="outlined" className="h-full shadow">
                        <CardHeader title={textT?.comment?.title} sx={{ py: 2 }} />

                        <Divider />

                        <CardContent>
                          <Typography variant="body1">{cashRegister.comment || '--'}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Dialog
                      open={reopenState.open}
                      onClose={handleReopenClose}
                      aria-labelledby="alert-dialog-title"
                      aria-describedby="alert-dialog-description">
                      <DialogTitle id="alert-dialog-title">{textT?.dialogReopenTitle}</DialogTitle>
                      <DialogContent dividers>
                        <DialogContentText id="alert-dialog-description">
                          {textT?.dialogReopenMessage}
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button
                          variant="text"
                          color="secondary"
                          onClick={handleReopenClose}
                          disabled={reopenState.loading}>
                          {textT?.btnCancel}
                        </Button>
                        <Button variant="text" color="primary" onClick={handleReopen} loading={reopenState.loading}>
                          {textT?.btnContinue}
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default CashRegistersView;
