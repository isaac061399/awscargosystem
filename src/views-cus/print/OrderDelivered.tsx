/* eslint-disable @next/next/no-img-element */
'use client';

import { Fragment, useEffect } from 'react';

import moment from 'moment';

import { useConfig } from '@/components/ConfigProvider';

import { padStartZeros } from '@/libs/utils';

import { getClientAddress } from '@/helpers/address';

import { useAdmin } from '@/components/AdminProvider';

const footerLines = ['Gracias por su preferencia.', '----------------- Última Línea -----------------'];

const OrderDelivered = ({ order, original }: { order: any; original?: string }) => {
  const { configuration } = useConfig();

  const { data: admin } = useAdmin();

  // Auto print
  useEffect(() => {
    // Auto close tab after print, allowed because this page is opened via window.open from the reception page
    window.addEventListener('afterprint', () => window.close());

    // Auto print small delay helps fonts/layout settle
    const t = window.setTimeout(() => window.print(), 150);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('afterprint', () => window.close());
    };
  }, []);

  return (
    <div className="ticket">
      {/* Header */}
      <div className="logo-wrap">
        <img src="/logos/logo.svg" alt="Company logo" className="logo" />
      </div>
      <div className="center bold">{original === '1' ? 'ORIGINAL' : 'COPIA'}</div>
      <div className="center bold">ENTREGA DE PEDIDO # {padStartZeros(order.id, 4)}</div>

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

      {/* OrderDelivered meta */}
      <div className="kv">
        <span className="bold">Fecha Impresión:</span> {moment().format('DD/MM/YYYY hh:mm a')}
      </div>

      <div className="kv">
        <span className="bold">ID de Pedido:</span> # {padStartZeros(order.id, 4)}
      </div>
      <div className="kv">
        <span className="bold">Número de Pedido:</span> {order.number}
      </div>

      <div className="kv">
        <span className="bold">Usuario:</span> {admin.email}
      </div>

      <div className="line" />

      {/* Customer */}
      <div className="kv">
        <span className="bold">Cédula:</span> {order.client.identification}
      </div>
      <div className="kv">
        <span className="bold">Nombre:</span> {order.client.full_name}
      </div>
      <div className="kv">
        <span className="bold">Correo:</span> {order.client.email}
      </div>
      <div className="kv">
        <span className="bold">Teléfono:</span> {order.client.phone}
      </div>
      <div className="kv">
        <span className="bold">Dirección:</span> {getClientAddress(order.client)}
      </div>

      <div className="line" />

      {/* Items */}
      <div className="items">
        {order.products.map((p: any, index: number) => {
          return (
            <Fragment key={index}>
              <div className="item">
                <div className="row">
                  <span className="muted">Producto:</span>
                  <div>{p.name}</div>
                </div>
                <div className="row">
                  <div className="muted">Cantidad:</div>
                  <div>{p.quantity}</div>
                </div>
                <div className="row">
                  <span className="muted">Tracking:</span>
                  <div>{p.tracking}</div>
                </div>
                <div className="row">
                  <span className="muted">Fecha de Entrega:</span>
                  <div>{moment(p.status_date).format('DD/MM/YYYY hh:mm a')}</div>
                </div>
              </div>
              {index !== order.products.length - 1 ? <div className="line" /> : null}
            </Fragment>
          );
        })}
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

export default OrderDelivered;
