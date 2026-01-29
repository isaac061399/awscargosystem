/* eslint-disable @next/next/no-img-element */
'use client';

import { Fragment, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import moment from 'moment';

import { useConfig } from '@/components/ConfigProvider';

import { formatMoney } from '@/libs/utils';
import { billingDefaultDesc, currencies } from '@/libs/constants';

import { Currency } from '@/prisma/generated/enums';
import { convertCRC, convertUSD } from '@/helpers/calculations';

const footerLines = [
  'Gracias por su preferencia.',
  'Version 4.4',
  'Autorizada mediante resolución DGT-R-033-2019 del 20 de junio de 2019',
  '----------------- Última Línea -----------------'
];

const Invoice = ({ invoice, original }: { invoice: any; original?: string }) => {
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
      <div className="center bold">{labelsT?.invoiceType?.[invoice.type]?.toUpperCase()}</div>

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

      {/* Invoice meta */}
      <div className="kv">
        <span className="bold">Fecha Emisión:</span> {moment(invoice.created_at).format('DD/MM/YYYY hh:mm a')}
      </div>

      <div className="kv">
        <span className="bold">Moneda:</span> {labelsT?.currency?.[invoice.currency]}
      </div>
      <div className="kv">
        <span className="bold">Tipo Cambio:</span> Venta{' '}
        {formatMoney(invoice.selling_exchange_rate, `${currencies[Currency.CRC].symbol} `)}
        {' | '}
        Compra {formatMoney(invoice.buying_exchange_rate, `${currencies[Currency.CRC].symbol} `)}
      </div>

      <div className="kv">
        <span className="bold">Consecutivo:</span> {invoice.consecutive}
      </div>
      <div className="kv">
        <span className="bold">Clave:</span> {invoice.numeric_key}
      </div>

      <div className="kv">
        <span className="bold">Usuario:</span> {invoice.cash_register.administrator.email}
      </div>

      <div className="line" />

      {/* Customer */}
      <div className="kv">
        <span className="bold">Cédula:</span> {invoice.client.identification}
      </div>
      <div className="kv">
        <span className="bold">Nombre:</span> {invoice.client.full_name}
      </div>
      <div className="kv">
        <span className="bold">Correo:</span> {invoice.client.email}
      </div>
      <div className="kv">
        <span className="bold">Teléfono:</span> {invoice.client.phone}
      </div>
      <div className="kv">
        <span className="bold">Dirección:</span> {invoice.client?.district?.canton?.province?.name},{' '}
        {invoice.client?.district?.canton?.name}, {invoice.client?.district?.name}, {invoice.client?.address}
      </div>

      <div className="line" />

      {/* Items */}
      <div className="items">
        {invoice.invoice_lines.map((l: any, index: number) => {
          let label = '';
          let labelValue = '';
          let desc = '';
          if (l.package) {
            label = 'Tracking-Paq';
            labelValue = l.package.tracking;
            desc = billingDefaultDesc;
          } else if (l.order_product) {
            if (l.order_product.tracking) {
              label = 'Tracking-Ped';
              labelValue = l.order_product.tracking;
            } else {
              label = 'Código-Ped';
              labelValue = l.order_product.code;
            }
            desc = billingDefaultDesc;
          } else if (l.product) {
            label = 'Código-Prod';
            labelValue = l.product.code;
            desc = l.product.name;
          }

          const invoiceCurrency = invoice.currency;
          let unitPrice = l.unit_price;
          let subtotal = l.total;
          if (l.currency !== invoiceCurrency) {
            if (invoiceCurrency === Currency.CRC) {
              unitPrice = convertCRC(l.unit_price, invoice.selling_exchange_rate);
              subtotal = convertCRC(l.total, invoice.selling_exchange_rate);
            } else if (invoiceCurrency === Currency.USD) {
              unitPrice = convertUSD(l.unit_price, invoice.buying_exchange_rate);
              subtotal = convertUSD(l.total, invoice.buying_exchange_rate);
            }
          }

          return (
            <Fragment key={index}>
              <div className="item">
                <div className="row">
                  <span className="muted">{label}:</span>
                  <div>{labelValue}</div>
                </div>
                <div className="row">
                  <span className="muted">Descripción:</span>
                  <div>{desc}</div>
                </div>
                <div className="row">
                  <div className="muted">Cantidad:</div>
                  <div>{l.quantity}</div>
                </div>
                <div className="row">
                  <div className="muted">Precio Unitario:</div>
                  <div>{formatMoney(unitPrice, `${currencies[invoiceCurrency].symbol} `)}</div>
                </div>
                <div className="row">
                  <div className="muted">Precio Total:</div>
                  <div>{formatMoney(subtotal, `${currencies[invoiceCurrency].symbol} `)}</div>
                </div>
              </div>
              {index !== invoice.invoice_lines.length - 1 ? <div className="line" /> : null}
            </Fragment>
          );
        })}
      </div>

      <div className="line" />

      {/* Totals */}
      <div className="row">
        <div className="muted">Total Gravado:</div>
        <div>{formatMoney(invoice.subtotal, `${currencies[invoice.currency].symbol} `)}</div>
      </div>
      <div className="row">
        <div className="muted">Total Exento:</div>
        <div>{formatMoney(0, `${currencies[invoice.currency].symbol} `)}</div>
      </div>
      <div className="row">
        <div className="muted">Total Exonerado:</div>
        <div>{formatMoney(0, `${currencies[invoice.currency].symbol} `)}</div>
      </div>
      <div className="row">
        <div className="muted">Total Venta (Subtotal):</div>
        <div>{formatMoney(invoice.subtotal, `${currencies[invoice.currency].symbol} `)}</div>
      </div>
      <div className="row">
        <div className="muted">Total Descuento:</div>
        <div>{formatMoney(0, `${currencies[invoice.currency].symbol} `)}</div>
      </div>
      <div className="row">
        <div className="muted">Total Venta Neta:</div>
        <div>{formatMoney(invoice.subtotal, `${currencies[invoice.currency].symbol} `)}</div>
      </div>
      <div className="row">
        <div className="muted">Total Impuesto (IVA):</div>
        <div>{formatMoney(invoice.tax, `${currencies[invoice.currency].symbol} `)}</div>
      </div>
      <div className="row">
        <div className="muted">Total IVA Devuelto:</div>
        <div>{formatMoney(0, `${currencies[invoice.currency].symbol} `)}</div>
      </div>
      <div className="row">
        <div className="muted">Total Otros Cargos:</div>
        <div>{formatMoney(0, `${currencies[invoice.currency].symbol} `)}</div>
      </div>

      <div className="line" />

      <div className="row bold">
        <div>Total Comprobante:</div>
        <div>{formatMoney(invoice.total, `${currencies[invoice.currency].symbol} `)}</div>
      </div>

      <div className="line" />

      <div className="row bold">
        <div>Medio de Pago</div>
        <div>Monto</div>
      </div>
      {invoice.invoice_payments.length === 0 ? (
        <div className="row">
          <div>Pendiente</div>
          <div></div>
        </div>
      ) : null}
      {invoice.invoice_payments.map((p: any, index: number) => (
        <div className="row" key={index}>
          <div>{labelsT?.paymentMethod[p.payment_method]}</div>
          <div>{formatMoney(p.amount, `${currencies[p.currency].symbol} `)}</div>
        </div>
      ))}

      <div className="line" />

      <div className="row">
        <div className="muted">Vuelto:</div>
        <div>{formatMoney(invoice.cash_change, `${currencies[Currency.CRC].symbol} `)}</div>
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

export default Invoice;
