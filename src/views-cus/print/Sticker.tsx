/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect } from 'react';
import moment from 'moment';

import Barcode from '@/components/custom/Bardcode';

const Sticker = ({ sticker }: { sticker: any }) => {
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

  const date = moment().format('DD/MM/YYYY hh:mm A');

  return (
    <div className="sheet">
      <div className="grid">
        {/* MAIN */}
        <div className="main">
          {/* Header */}
          <div className="header">
            <img className="logo" src="/logos/logo.svg" alt="Logo" />

            <div className="hdr-right">
              <div className="warehouse">AWS CARGO & COURIER</div>
              <div className="warehouse-code">{sticker?.client?.mailbox}</div>
              <div className="loc">
                Estante: {sticker?.location?.shelf || '-'} &nbsp; Fila: {sticker?.location?.row || '-'}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="name"> {sticker?.client?.name}</div>

          {/* Phone */}
          <div className="line">Teléfono: {sticker?.client?.phone || '-'}</div>

          {/* Address */}
          <div className="line">Dirección: {sticker?.client?.address || '-'}</div>

          {/* Barcode + meta */}
          <div className="barcodeBlock">
            <div className="printMeta">Fecha Impresión: {date}</div>
            <div className="tracking">Tracking: {sticker?.tracking}</div>

            <div className="barcodeWrap">
              <Barcode value={sticker?.tracking} height={44} displayValue={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sticker;
