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
import { currencies } from '@/libs/constants';
import { calculateCashRegisterTotals } from '@/helpers/calculations';

const getCashDetail = (options: { [key: string]: string }, data: { [key: string]: number }) => {
  const detail = [] as { title: string; value: number }[];

  Object.keys(options).forEach((key) => {
    detail.push({ title: options[key], value: data[key] || 0 });
  });

  return detail;
};

const CashClosed = ({ cashRegister }: { cashRegister: any }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('cash-control:text', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const moneyT: any = useMemo(() => t('constants:money', { returnObjects: true, default: {} }), [t]);

  const lines: { [key: string]: any } = {};
  cashRegister.lines.forEach((line: any) => {
    lines[line.currency] = line;
  });

  // CRC calculations
  const totalsCRC = calculateCashRegisterTotals(lines['CRC']);
  const cashDetailCRC = getCashDetail(
    moneyT?.CRC || {},
    lines.CRC?.cash_reported_data ? JSON.parse(lines.CRC.cash_reported_data) : {}
  );
  const [resultIconCRC, resultColorCRC] =
    totalsCRC.cash.difference < 0
      ? ['arrow-down-circle-fill', 'error']
      : totalsCRC.cash.difference > 0
        ? ['arrow-up-circle-fill', 'warning']
        : ['checkbox-circle-fill', 'success'];

  // USD calculations
  const totalsUSD = calculateCashRegisterTotals(lines['USD']);
  const cashDetailUSD = getCashDetail(
    moneyT?.USD || {},
    lines.USD?.cash_reported_data ? JSON.parse(lines.USD.cash_reported_data) : {}
  );
  const [resultIconUSD, resultColorUSD] =
    totalsUSD.cash.difference < 0
      ? ['arrow-down-circle-fill', 'error']
      : totalsUSD.cash.difference > 0
        ? ['arrow-up-circle-fill', 'warning']
        : ['checkbox-circle-fill', 'success'];

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
            title={`${textT?.result?.title} (${labelsT?.currency?.CRC})`}
            sx={{ py: 2 }}
            action={<i className={`ri-${resultIconCRC} text-${resultColorCRC}`} />}
          />

          <Divider />

          <CardContent>
            <Typography variant="body1" className="flex items-center gap-1">
              <strong>{textT?.result?.reported}:</strong>{' '}
              {formatMoney(totalsCRC.cash.reported, `${currencies.CRC.symbol} `)}
            </Typography>
            <Typography variant="body1" className="flex items-center gap-1">
              <strong>{textT?.result?.system}:</strong>{' '}
              {formatMoney(totalsCRC.cash.system, `${currencies.CRC.symbol} `)}
              <Tooltip title={textT?.result?.systemInfo} placement="top">
                <i className="ri-information-fill text-primary" />
              </Tooltip>
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.result?.difference}:</strong>{' '}
              {formatMoney(totalsCRC.cash.difference, `${currencies.CRC.symbol} `)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Card variant="outlined" className="h-full shadow">
          <CardHeader
            title={`${textT?.result?.title} (${labelsT?.currency?.USD})`}
            sx={{ py: 2 }}
            action={<i className={`ri-${resultIconUSD} text-${resultColorUSD}`} />}
          />

          <Divider />

          <CardContent>
            <Typography variant="body1" className="flex items-center gap-1">
              <strong>{textT?.result?.reported}:</strong>{' '}
              {formatMoney(totalsUSD.cash.reported, `${currencies.USD.symbol} `)}
            </Typography>
            <Typography variant="body1" className="flex items-center gap-1">
              <strong>{textT?.result?.system}:</strong>{' '}
              {formatMoney(totalsUSD.cash.system, `${currencies.USD.symbol} `)}
              <Tooltip title={textT?.result?.systemInfo} placement="top">
                <i className="ri-information-fill text-primary" />
              </Tooltip>
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.result?.difference}:</strong>{' '}
              {formatMoney(totalsUSD.cash.difference, `${currencies.USD.symbol} `)}
            </Typography>
          </CardContent>
        </Card>
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
              <strong>{textT?.detail?.invoiceCount}:</strong> {cashRegister.invoice_count}
            </Typography>

            <Divider className="my-2" />

            <DualCurrencyRow
              label=""
              crc={<strong>{labelsT?.currency?.CRC}</strong>}
              usd={<strong>{labelsT?.currency?.USD}</strong>}
            />
            <DualCurrencyRow
              label={textT?.detail?.cashBalance}
              crc={formatMoney(lines.CRC.cash_balance, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.cash_balance, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.cashReported}
              crc={formatMoney(lines.CRC.cash_reported, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.cash_reported, `${currencies.USD.symbol} `)}
            />

            <Divider className="my-2" />

            <DualCurrencyRow
              label={textT?.detail?.cashIn}
              crc={formatMoney(lines.CRC.cash_in, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.cash_in, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.sinpeIn}
              crc={formatMoney(lines.CRC.sinpe_in, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.sinpe_in, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.transferIn}
              crc={formatMoney(lines.CRC.transfer_in, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.transfer_in, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.cardIn}
              crc={formatMoney(lines.CRC.card_in, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.card_in, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.totalIn}
              crc={formatMoney(totalsCRC.in, `${currencies.CRC.symbol} `)}
              usd={formatMoney(totalsUSD.in, `${currencies.USD.symbol} `)}
            />

            <Divider className="my-2" />

            <DualCurrencyRow
              label={textT?.detail?.cashOut}
              crc={formatMoney(lines.CRC.cash_out, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.cash_out, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.sinpeOut}
              crc={formatMoney(lines.CRC.sinpe_out, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.sinpe_out, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.transferOut}
              crc={formatMoney(lines.CRC.transfer_out, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.transfer_out, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.cardOut}
              crc={formatMoney(lines.CRC.card_out, `${currencies.CRC.symbol} `)}
              usd={formatMoney(lines.USD.card_out, `${currencies.USD.symbol} `)}
            />
            <DualCurrencyRow
              label={textT?.detail?.totalOut}
              crc={formatMoney(totalsCRC.out, `${currencies.CRC.symbol} `)}
              usd={formatMoney(totalsUSD.out, `${currencies.USD.symbol} `)}
            />

            <Divider className="my-2" />

            <DualCurrencyRow
              label={textT?.detail?.cashChange}
              crc={formatMoney(totalsCRC.change, `${currencies.CRC.symbol} `)}
              usd={formatMoney(totalsUSD.change, `${currencies.USD.symbol} `)}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 6 }}>
        <Card variant="outlined" className="h-full shadow">
          <CardHeader title={textT?.cashDetail?.title} sx={{ py: 2 }} />

          <Divider />

          <CardContent>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
              {/* CRC */}
              <div>
                <Typography variant="body1" className="font-bold mb-2">
                  {labelsT?.currency?.CRC}
                </Typography>
                {cashDetailCRC.map((item, i) => (
                  <Typography variant="body1" key={i}>
                    <strong>{item.title}:</strong> {item.value}
                  </Typography>
                ))}
              </div>

              {/* Vertical divider */}
              <Divider orientation="vertical" flexItem />

              {/* USD */}
              <div>
                <Typography variant="body1" className="font-bold mb-2">
                  {labelsT?.currency?.USD}
                </Typography>
                {cashDetailUSD.map((item, i) => (
                  <Typography variant="body1" key={i}>
                    <strong>{item.title}:</strong> {item.value}
                  </Typography>
                ))}
              </div>
            </div>
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

const DualCurrencyRow = ({ label, crc, usd }: { label: string; crc: React.ReactNode; usd: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-[2fr_auto_1fr_auto_1fr] items-center gap-3">
      {/* Label */}
      <Typography variant="body1" className="font-bold">
        {label}
      </Typography>

      {/* Vertical divider */}
      <Divider orientation="vertical" flexItem />

      {/* CRC */}
      <Typography variant="body1" className="tabular-nums">
        {crc}
      </Typography>

      {/* Vertical divider */}
      <Divider orientation="vertical" flexItem />

      {/* USD */}
      <Typography variant="body1" className="tabular-nums">
        {usd}
      </Typography>
    </div>
  );
};

export default CashClosed;
