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
import { padStartZeros } from '@/libs/utils';

const PendingOrderProductsTable = ({ pendingOrderProducts }: { pendingOrderProducts: any[] }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('home:text.pendingOrderProducts', { returnObjects: true, default: {} }), [t]);

  return (
    <Card>
      <CardHeader title={textT.title} />
      <CardContent>
        <div className="overflow-x-auto">
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small" className={tableStyles.table}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">{textT?.id}</TableCell>
                  <TableCell align="center">{textT?.number}</TableCell>
                  <TableCell align="center">{textT?.client}</TableCell>
                  <TableCell align="center">{textT?.description}</TableCell>
                  <TableCell align="center">{textT?.daysPending}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingOrderProducts.length <= 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="textSecondary" className="font-medium">
                        {textT?.noItems}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {pendingOrderProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Link
                        href={`/orders/edit/${product.order?.id}`}
                        target="_blank"
                        className="underline underline-offset-2 hover:no-underline transition">
                        <Typography color="text.primary" className="font-medium">
                          # {padStartZeros(product.order?.id, 4)}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">{product.order?.number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">
                        {`${product.order?.client?.office?.mailbox_prefix}${product.order?.client?.id}`} |{' '}
                        {product.order?.client?.full_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">{`${product.quantity} x ${product.name}`}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.primary">{moment().diff(moment(product.status_date), 'days')}</Typography>
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

export default PendingOrderProductsTable;
