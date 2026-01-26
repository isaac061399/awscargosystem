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

  // CRC Calculations
  const totalInCRC = lines.CRC.cash_in + lines.CRC.sinpe_in + lines.CRC.transfer_in + lines.CRC.card_in;
  const totalOutCRC = lines.CRC.cash_out + lines.CRC.sinpe_out + lines.CRC.transfer_out + lines.CRC.card_out;
  const totalChangeCRC =
    lines.CRC.cash_change + lines.CRC.sinpe_change + lines.CRC.transfer_change + lines.CRC.card_change;

  const totalReportedCRC = lines.CRC.cash_reported - lines.CRC.cash_balance;
  const totalCRC = lines.CRC.cash_in - lines.CRC.cash_out;
  const totalDifferenceCRC = totalReportedCRC - Math.abs(totalCRC);

  const [resultIconCRC, resultColorCRC] =
    totalDifferenceCRC < 0
      ? ['arrow-down-circle-fill', 'error']
      : totalDifferenceCRC > 0
        ? ['arrow-up-circle-fill', 'warning']
        : ['checkbox-circle-fill', 'success'];

  const cashDetailCRC = getCashDetail(
    moneyT?.CRC || {},
    lines.CRC?.cash_reported_data ? JSON.parse(lines.CRC.cash_reported_data) : {}
  );

  // USD Calculations
  const totalInUSD = lines.USD.cash_in + lines.USD.sinpe_in + lines.USD.transfer_in + lines.USD.card_in;
  const totalOutUSD = lines.USD.cash_out + lines.USD.sinpe_out + lines.USD.transfer_out + lines.USD.card_out;
  const totalChangeUSD =
    lines.USD.cash_change + lines.USD.sinpe_change + lines.USD.transfer_change + lines.USD.card_change;

  const totalReportedUSD = lines.USD.cash_reported - lines.USD.cash_balance;
  const totalUSD = lines.USD.cash_in - lines.USD.cash_out;
  const totalDifferenceUSD = totalReportedUSD - Math.abs(totalUSD);

  const [resultIconUSD, resultColorUSD] =
    totalDifferenceUSD < 0
      ? ['arrow-down-circle-fill', 'error']
      : totalDifferenceUSD > 0
        ? ['arrow-up-circle-fill', 'warning']
        : ['checkbox-circle-fill', 'success'];

  const cashDetailUSD = getCashDetail(
    moneyT?.USD || {},
    lines.USD?.cash_reported_data ? JSON.parse(lines.USD.cash_reported_data) : {}
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
            title={`${textT?.result?.title} (${labelsT?.currency?.CRC})`}
            sx={{ py: 2 }}
            action={<i className={`ri-${resultIconCRC} text-${resultColorCRC}`} />}
          />

          <Divider />

          <CardContent>
            <Typography variant="body1" className="flex items-center gap-1">
              <strong>{textT?.result?.totalReported}:</strong>{' '}
              {formatMoney(totalReportedCRC, `${currencies.CRC.symbol} `)}
              <Tooltip title={textT?.result?.totalReportedInfo} placement="top">
                <i className="ri-information-fill text-primary" />
              </Tooltip>
            </Typography>
            <Typography variant="body1" className="flex items-center gap-1">
              <strong>{textT?.result?.total}:</strong> {formatMoney(totalCRC, `${currencies.CRC.symbol} `)}
              <Tooltip title={textT?.result?.totalInfo} placement="top">
                <i className="ri-information-fill text-primary" />
              </Tooltip>
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.result?.difference}:</strong>{' '}
              {formatMoney(totalDifferenceCRC, `${currencies.CRC.symbol} `)}
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
              <strong>{textT?.result?.totalReported}:</strong>{' '}
              {formatMoney(totalReportedUSD, `${currencies.USD.symbol} `)}
              <Tooltip title={textT?.result?.totalReportedInfo} placement="top">
                <i className="ri-information-fill text-primary" />
              </Tooltip>
            </Typography>
            <Typography variant="body1" className="flex items-center gap-1">
              <strong>{textT?.result?.total}:</strong> {formatMoney(totalUSD, `${currencies.USD.symbol} `)}
              <Tooltip title={textT?.result?.totalInfo} placement="top">
                <i className="ri-information-fill text-primary" />
              </Tooltip>
            </Typography>
            <Typography variant="body1">
              <strong>{textT?.result?.difference}:</strong>{' '}
              {formatMoney(totalDifferenceUSD, `${currencies.USD.symbol} `)}
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
              crc={formatMoney(totalInCRC, `${currencies.CRC.symbol} `)}
              usd={formatMoney(totalInUSD, `${currencies.USD.symbol} `)}
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
              crc={formatMoney(totalOutCRC, `${currencies.CRC.symbol} `)}
              usd={formatMoney(totalOutUSD, `${currencies.USD.symbol} `)}
            />

            <Divider className="my-2" />

            <DualCurrencyRow
              label={textT?.detail?.cashChange}
              crc={formatMoney(totalChangeCRC, `${currencies.CRC.symbol} `)}
              usd={formatMoney(totalChangeUSD, `${currencies.USD.symbol} `)}
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
