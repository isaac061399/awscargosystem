import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { InvoiceStatus } from '@/prisma/generated/enums';
import { TransactionError, withTransaction } from '@libs/prisma';
import { getOpenCashRegister } from '@/controllers/CashRegister.Controller';
import { getInvoice, validatePayments } from '@/controllers/Invoice.Controller';
// import { convertCRC } from '@/helpers/calculations';
import { calculateBillingChangeAmount, calculateBillingPaidAmount } from '@/helpers/calculations';

export const POST = withAuthApi(['invoices.pay'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:invoices', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    // validate if admin has open cash register
    const cashRegister = await getOpenCashRegister(admin.id);
    if (!cashRegister) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noOpenCash }, { status: 400 });
    }

    // validate entry
    const entry = await getInvoice(Number(id));
    if (!entry) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notFound }, { status: 404 });
    }
    if (entry.status !== InvoiceStatus.PENDING) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notPayable }, { status: 400 });
    }

    // validate payment
    const {
      valid: paymentsValid,
      data: paymentsData,
      errors: paymentsErrors
    } = validatePayments([
      {
        id: '1',
        currency: data.currency,
        method: data.method,
        ref: data.ref,
        ref_bank: data.ref_bank,
        amount: data.amount
      }
    ]);
    if (!paymentsValid) {
      return NextResponse.json(
        {
          valid: false,
          message: textT?.errors?.paymentsError?.replace('{{ errors }}', paymentsErrors?.join(', ') || '')
        },
        { status: 400 }
      );
    }

    // validate totals
    const paidAmount = calculateBillingPaidAmount(
      paymentsData || [],
      entry.currency,
      entry.selling_exchange_rate,
      entry.buying_exchange_rate
    );
    if (paidAmount < entry.total) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notEnoughPaidAmount }, { status: 400 });
    }

    // pay invoice
    const result = await withTransaction(async (tx) => {
      // 1: generate invoice variables
      const changeAmountCRC = calculateBillingChangeAmount(
        paidAmount,
        entry.total,
        entry.currency,
        entry.buying_exchange_rate
      );

      // 2: pay invoice
      const paidInvoice = await tx.cusInvoice.update({
        where: { id: entry.id },
        data: {
          payment_method: data.method,
          payment_method_ref: data.ref || '',
          cash_change: changeAmountCRC,
          status: InvoiceStatus.PAID,
          paid_at: new Date(),
          invoice_payments: {
            createMany: {
              data: [
                {
                  cash_register_id: cashRegister.id,
                  currency: data.currency,
                  payment_method: data.method,
                  ref: data.ref || '',
                  ref_bank: data.ref_bank || '',
                  amount: data.amount
                }
              ]
            }
          }
        }
      });
      if (!paidInvoice) {
        throw new TransactionError(400, textT?.errors?.cancel);
      }

      // 5: save log
      await tx.cusInvoiceLog.create({
        data: {
          invoice_id: paidInvoice.id,
          administrator_id: admin.id,
          action: 'invoice.pay',
          data: JSON.stringify(entry)
        }
      });

      return { change: changeAmountCRC };
    });

    return NextResponse.json({ valid: true, ...result }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
