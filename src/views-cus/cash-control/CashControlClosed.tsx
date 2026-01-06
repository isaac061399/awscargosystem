'use client';

// React Imports
import { useMemo } from 'react';

// Next Imports
import Link from 'next/link';

import { useTranslation } from 'react-i18next';
import moment from 'moment';

// MUI Imports
import { Button, Card, CardContent, CardHeader, Divider, Grid, Tooltip, Typography } from '@mui/material';

// Utils Imports
import { formatMoney } from '@libs/utils';

const getCashDetail = (options: { [key: string]: string }, data: { [key: string]: number }) => {
  const detail = [] as { title: string; value: number }[];

  Object.keys(options).forEach((key) => {
    detail.push({ title: options[key], value: data[key] || 0 });
  });

  return detail;
};

const CashClosed = ({ cashRegister }: { cashRegister: any }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('cash:text', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const handlePrintTicket = async () => {
    const pdfUrl = `/api/cash-registers/today-ticket`;
    const win = window.open(pdfUrl, '_blank');

    if (win) {
      // Auto print when the new tab loads
      win.onload = () => {
        win.print();
      };
    }
  };

  const totalReported = cashRegister.cash_reported - cashRegister.cash_balance;
  const total = cashRegister.cash_amount - cashRegister.cash_outflows;
  const totalDifference = totalReported - total;
  let resultIcon = 'checkbox-circle-fill';
  let resultColor = 'success';

  if (totalDifference < 0) {
    resultIcon = 'arrow-down-circle-fill';
    resultColor = 'error';
  } else if (totalDifference > 0) {
    resultIcon = 'arrow-up-circle-fill';
    resultColor = 'warning';
  }

  const cashDetail = getCashDetail(
    labelsT?.cashMoney || {},
    cashRegister?.cash_reported_data ? JSON.parse(cashRegister.cash_reported_data) : {}
  );

  return (
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
              <strong>{textT?.result?.totalReported}:</strong> {formatMoney(totalReported)}
              <Tooltip title={textT?.result?.totalReportedInfo} placement="top">
                <i className="ri-information-fill text-primary" />
              </Tooltip>
            </Typography>
            <Typography variant="body1" className="flex items-center gap-1">
              <strong>{textT?.result?.total}:</strong> {formatMoney(total)}
              <Tooltip title={textT?.result?.totalInfo} placement="top">
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
              <strong>{textT?.detail?.openDate}:</strong> {moment(cashRegister.open_date).format(textT?.dateTimeFormat)}
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.detail?.closeDate}:</strong>{' '}
              {moment(cashRegister.close_date).format(textT?.dateTimeFormat)}
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.detail?.cashBalance}:</strong> {formatMoney(cashRegister.cash_balance)}
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.detail?.cashReported}:</strong> {formatMoney(cashRegister.cash_reported)}
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.detail?.cashAmount}:</strong> {formatMoney(cashRegister.cash_amount)}
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.detail?.sinpeAmount}:</strong> {formatMoney(cashRegister.sinpe_amount)}
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.detail?.transferAmount}:</strong> {formatMoney(cashRegister.transfer_amount)}
            </Typography>
            {/* <Typography variant="body1">
              <strong>{textT?.detail?.cardAmount}:</strong> {formatMoney(cashRegister.card_amount)}
            </Typography> */}
            <Typography variant="body1">
              <strong>{textT?.detail?.cashOutflows}:</strong> {formatMoney(cashRegister.cash_outflows)}
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.detail?.sinpeOutflows}:</strong> {formatMoney(cashRegister.sinpe_outflows)}
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.detail?.transferOutflows}:</strong> {formatMoney(cashRegister.transfer_outflows)}
            </Typography>
            {/* <Typography variant="body1">
              <strong>{textT?.detail?.cardOutflows}:</strong> {formatMoney(cashRegister.card_outflows)}
            </Typography> */}
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
    </Grid>
  );
};

export default CashClosed;
