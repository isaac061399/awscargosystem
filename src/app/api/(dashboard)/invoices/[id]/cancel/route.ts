/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import moment from 'moment';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { billingDefaultActivityCode } from '@/libs/constants';
import { CancelDocumentData, generateCancelDocument } from '@/services/easytax';

import { CusConfiguration, CusInvoice, CusInvoiceLine, CusOffice } from '@/prisma/generated/client';
import { Currency, InvoiceStatus } from '@/prisma/generated/enums';

// import { getOpenCashRegister } from '@/controllers/CashRegister.Controller';
import { getInvoice, rollbackLineReferences } from '@/controllers/Invoice.Controller';
import { validateOrderStatus } from '@/controllers/Order.Controller';
import { getConfiguration } from '@/controllers/Configuration.Controller';
import { calculateTaxes, convertCRC, convertUSD } from '@/helpers/calculations';

export const PUT = withAuthApi(['invoices.cancel'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:invoices', { returnObjects: true, default: {} });

  const admin = req.session;

  try {
    // validate if admin has open cash register
    // const cashRegister = await getOpenCashRegister(admin.id);
    // if (!cashRegister) {
    //   return NextResponse.json({ valid: false, message: textT?.errors?.noOpenCash }, { status: 400 });
    // }

    // validate entry
    const entry = await getInvoice(Number(id));
    if (!entry) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notFound }, { status: 404 });
    }
    if (entry.status === InvoiceStatus.CANCELED) {
      return NextResponse.json({ valid: false, message: textT?.errors?.alreadyCanceled }, { status: 400 });
    }

    // get configuration
    const configuration = await getConfiguration();
    if (!configuration) {
      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 400 });
    }

    // cancel invoice
    await withTransaction(async (tx) => {
      // 1: rollback status of packages and order products
      const rollback = await rollbackLineReferences(entry.invoice_lines as any[], tx);
      if (!rollback) {
        throw new TransactionError(400, textT?.errors?.cancel);
      }

      // 2: validate order statuses of order products
      for (const line of entry.invoice_lines || []) {
        if (line.order_product) {
          // validate order status
          await validateOrderStatus(line.order_product.order_id, tx);
        }
      }

      // 3: send invoice credit note to easytax service
      // const documentPayload = buildCancelDocumentPayload({
      //   configuration,
      //   office: entry.cash_register.office as CusOffice,
      //   invoice: entry,
      //   lines: entry.invoice_lines
      // });
      // const easytaxResponse = await generateCancelDocument(documentPayload);
      // if (!easytaxResponse.valid) {
      //   throw new TransactionError(500, textT?.errors?.easytaxService);
      // }

      // throw new TransactionError(500, textT?.errors?.save);

      // 4: change invoice status to CANCELED
      const canceledInvoice = await tx.cusInvoice.update({
        where: { id: entry.id },
        data: {
          status: InvoiceStatus.CANCELED,
          cancelled_at: new Date(),
          cancelled_by_id: admin.id
        }
      });
      if (!canceledInvoice) {
        throw new TransactionError(400, textT?.errors?.cancel);
      }

      // 5: save log
      await tx.cusInvoiceLog.create({
        data: {
          invoice_id: canceledInvoice.id,
          administrator_id: admin.id,
          action: 'invoice.cancel',
          data: JSON.stringify(entry)
        }
      });

      return { id: canceledInvoice.id };
    });

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

const buildCancelDocumentPayload = (data: {
  configuration: CusConfiguration;
  office: CusOffice;
  invoice: CusInvoice;
  lines: CusInvoiceLine[];
}): CancelDocumentData => {
  const { configuration, office, invoice, lines } = data;

  return {
    reference: {
      invoiceType: invoice.type,
      consecutive: invoice.consecutive,
      date: moment(invoice.created_at)
    },
    company: {
      name: configuration.billing_name,
      identification: configuration.billing_identification,
      activityCode: configuration.billing_activity_code
    },
    office: {
      number: office.billing_number,
      terminal: office.billing_terminal
    },
    client: {
      name: invoice.client_name,
      identification: invoice.client_identification,
      email: invoice.client_email,
      activityCode: invoice.client_activity_code || billingDefaultActivityCode
    },
    currency: invoice.currency,
    method: invoice.payment_method,
    ref: invoice.payment_method_ref || '',
    ivaPercentage: invoice.iva_percentage,
    lines: lines.map((line) => {
      const invoiceCurrency = invoice.currency;

      let unitPrice = line.unit_price;
      let subtotal = line.total;
      if (line.currency !== invoiceCurrency) {
        if (invoiceCurrency === Currency.CRC) {
          unitPrice = convertCRC(line.unit_price, invoice.selling_exchange_rate);
          subtotal = convertCRC(line.total, invoice.selling_exchange_rate);
        } else if (invoiceCurrency === Currency.USD) {
          unitPrice = convertUSD(line.unit_price, invoice.buying_exchange_rate);
          subtotal = convertUSD(line.total, invoice.buying_exchange_rate);
        }
      }

      const totals = calculateTaxes(subtotal, invoice.iva_percentage);

      return {
        cabys: line.cabys,
        description: line.description,
        quantity: line.quantity,
        unitPrice: unitPrice,
        subtotal: totals.subtotal,
        tax: totals.taxes,
        total: totals.total
      };
    })
  };
};
