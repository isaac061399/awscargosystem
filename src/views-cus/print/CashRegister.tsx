/* eslint-disable @next/next/no-img-element */
'use client';

import { Fragment, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import moment from 'moment';

import { useConfig } from '@/components/ConfigProvider';

import { formatMoney } from '@/libs/utils';
import { currencies } from '@/libs/constants';
import { calculateCashRegisterTotals } from '@/helpers/calculations';

const footerLines = [
  '',
  '',
  '',
  '',
  '_______________________________',
  'Firma',
  '',
  '----------------- Última Línea -----------------'
];

const CashRegister = ({ cashRegister, original }: { cashRegister: any; original?: string }) => {
  const { configuration } = useConfig();

  const { t } = useTranslation();
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  // Auto print
  useEffect(() => {
    // small delay helps fonts/layout settle
    const t = window.setTimeout(() => window.print(), 150);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="ticket">
      {/* Header */}
      <div className="logo-wrap">
        <img src="/logos/logo.svg" alt="Company logo" className="logo" />
      </div>
      <div className="center bold">{original === '1' ? 'ORIGINAL' : 'COPIA'}</div>
      <div className="center bold">REGISTRO DE CAJA #{cashRegister.id}</div>

      <div className="center bold" style={{ marginTop: 6 }}>
        {configuration.billing_name}
      </div>
      <div className="center small">Cédula Jurídica: {configuration.billing_identification}</div>
      <div className="center small">Teléfono: {configuration.billing_phone}</div>
      <div className="center small wrap">Correo: {configuration.billing_email}</div>
      <div className="center small wrap" style={{ marginTop: 4 }}>
        {configuration.billing_address}
      </div>

      <div className="line" />

      {/* Cash Register meta */}
      <div className="kv">
        <span className="bold">Oficina:</span> {cashRegister.office.name}
      </div>
      <div className="kv">
        <span className="bold">Usuario:</span> {cashRegister.administrator.email}
      </div>

      <br />

      <div className="kv">
        <span className="bold">Apertura:</span> {moment(cashRegister.open_date).format('DD/MM/YYYY hh:mm a')}
      </div>
      <div className="kv">
        <span className="bold">Cierre:</span> {moment(cashRegister.close_date).format('DD/MM/YYYY hh:mm a')}
      </div>

      <br />

      <div className="kv">
        <span className="bold">Cantidad Facturas:</span> {cashRegister.invoice_count}
      </div>

      <div className="line" />

      {/* Currencies data */}
      {cashRegister.lines.map((line: any, index: number) => {
        const moneyPrefix = `${currencies[line.currency].symbol} `;

        const totals = calculateCashRegisterTotals(line);

        const totalForAdmin = totals.cash.reported - line.cash_balance;

        return (
          <Fragment key={index}>
            <div className="kv">
              <span className="bold">Moneda:</span> {labelsT?.currency[line.currency]}
            </div>

            <br />

            <div className="kv">
              <span className="bold">Entradas Efectivo:</span> {formatMoney(line.cash_in, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Entradas Sinpe:</span> {formatMoney(line.sinpe_in, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Entradas Transferencia:</span> {formatMoney(line.transfer_in, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Entradas Tarjeta:</span> {formatMoney(line.card_in, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Total Entradas:</span> {formatMoney(totals.in, moneyPrefix)}
            </div>

            <br />

            <div className="kv">
              <span className="bold">Salidas Efectivo:</span> {formatMoney(line.cash_out, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Salidas Sinpe:</span> {formatMoney(line.sinpe_out, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Salidas Transferencia:</span> {formatMoney(line.transfer_out, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Salidas Tarjeta:</span> {formatMoney(line.card_out, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Total Salidas:</span> {formatMoney(totals.out, moneyPrefix)}
            </div>

            <br />

            <div className="kv">
              <span className="bold">Vueltos:</span> {formatMoney(totals.change, moneyPrefix)}
            </div>

            <br />

            <div className="kv">
              <span className="bold">Balance inicial:</span> {formatMoney(line.cash_balance, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Efectivo Reportado:</span> {formatMoney(totals.cash.reported, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Efectivo Sistema:</span> {formatMoney(totals.cash.system, moneyPrefix)}
            </div>
            <div className="kv">
              <span className="bold">Diferencia:</span> {formatMoney(totals.cash.difference, moneyPrefix)}
            </div>

            <br />

            <div className="kv">
              <span className="bold">Monto Para Entregar:</span> {formatMoney(totalForAdmin, moneyPrefix)}
            </div>

            <div className="line" />
          </Fragment>
        );
      })}

      {/* Comment */}

      <div className="kv">
        <span className="bold">Comentario:</span> {cashRegister.comment || '--'}
      </div>

      <div className="line" />

      <div className="center small">
        {footerLines.map((l: string, index: number) => (
          <Fragment key={index}>
            {l}
            <br />
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default CashRegister;
