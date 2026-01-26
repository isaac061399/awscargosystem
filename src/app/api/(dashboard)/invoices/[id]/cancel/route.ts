import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { InvoiceStatus } from '@/prisma/generated/enums';
import { TransactionError, withTransaction } from '@libs/prisma';
// import { getOpenCashRegister } from '@/controllers/CashRegister.Controller';
import { getInvoice, rollbackLineReferences } from '@/controllers/Invoice.Controller';
// import { convertCRC } from '@/helpers/calculations';
import { validateOrderStatus } from '@/controllers/Order.Controller';

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

    // cancel invoice
    await withTransaction(async (tx) => {
      // 1: rollback status of packages and order products
      const rollback = await rollbackLineReferences(entry.invoice_lines as any[], tx);
      if (!rollback) {
        throw new TransactionError(400, textT?.errors?.cancel);
      }

      // 2: change invoice status to CANCELED
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

      // 3: validate order statuses of order products
      for (const line of entry.invoice_lines || []) {
        if (line.order_product) {
          // validate order status
          await validateOrderStatus(line.order_product.order_id, tx);
        }
      }

      // 4: send invoice credit note to easytax service
      // TODO: implement easytax service integration

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
