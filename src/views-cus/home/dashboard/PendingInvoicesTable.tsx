'use client';

// React Imports
import { useMemo } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import moment from 'moment';

// MUI Imports
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

// Styles Imports
import tableStyles from '@core/styles/table.module.css';
import { formatMoney } from '@/libs/utils';
import { currencies } from '@/libs/constants';
import { InvoicePaymentCondition } from '@/prisma/generated/enums';

const PendingInvoicesTable = ({ pendingInvoices }: { pendingInvoices: any[] }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('home:text.pendingInvoices', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  return (
    <Card>
      <CardHeader title={textT.title} />
      <CardContent>
        <div className="overflow-x-auto">
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small" className={tableStyles.table}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">{textT?.consecutive}</TableCell>
                  <TableCell align="center">{textT?.client}</TableCell>
                  <TableCell align="center">{textT?.amount}</TableCell>
                  <TableCell align="center">{textT?.paymentCondition}</TableCell>
                  <TableCell align="center">{textT?.date}</TableCell>
                  <TableCell align="center">{textT?.expiredDate}</TableCell>
                  <TableCell align="center">{textT?.daysOverdue}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingInvoices.length <= 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary" className="font-medium">
                        {textT?.noItems}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {pendingInvoices.map((invoice, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Link
                        href={`/invoices/view/${invoice.id}`}
                        target="_blank"
                        className="underline underline-offset-2 hover:no-underline transition">
                        <Typography color="text.primary" className="font-medium">
                          {invoice.consecutive}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">
                        {`${invoice.client?.office?.mailbox_prefix}${invoice.client?.id}`} | {invoice.client?.full_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">
                        {formatMoney(invoice.total, `${currencies[invoice.currency].symbol} `)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">
                        {`${labelsT?.invoicePaymentCondition?.[invoice.payment_condition]} ${invoice.payment_condition !== InvoicePaymentCondition.CASH ? `(${invoice.payment_condition_days} ${textT?.paymentInfo?.paymentConditionDays})` : ''}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">
                        {moment(invoice.created_at).format(textT?.dateFormat)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">
                        {moment(invoice.expired_at).format(textT?.dateFormat)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">
                        {invoice.expired_days > 0 ? invoice.expired_days : 0}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingInvoicesTable;
