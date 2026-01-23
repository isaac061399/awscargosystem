import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { Currency, InvoicePaymentCondition, InvoiceStatus, InvoiceType } from '@/prisma/generated/enums';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { getOpenCashRegister } from '@/controllers/CashRegister.Controller';
import { clientSelectSchema, isValidBillingInformation } from '@/controllers/Client.Controller';
import {
  getMostValuablePayment,
  updateLineReferences,
  validateLines,
  validatePayments
} from '@/controllers/Invoice.Controller';
import { getConfiguration } from '@/controllers/Configuration.Controller';
import {
  calculateBillingChangeAmount,
  calculateBillingPaidAmount,
  calculateBillingTotal
} from '@/helpers/calculations';
import { validateOrderStatus } from '@/controllers/Order.Controller';

export const GET = withAuthApi(['invoices.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:invoices', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { number: { contains: search.trim(), mode: 'insensitive' } },
        { consecutive: { contains: search.trim(), mode: 'insensitive' } },
        { client: { id: parseInt(search.trim()) } },
        { client: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { client: { identification: { contains: search.trim(), mode: 'insensitive' } } },
        { client: { email: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    if (status !== '') {
      where['status'] = status;
    }

    if (params.client_id) {
      where['client_id'] = parseInt(params.client_id);
    }

    // query
    const invoices = await prismaRead.cusInvoice.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        consecutive: true,
        type: true,
        payment_condition: true,
        status: true,
        created_at: true,
        cash_register: {
          select: {
            id: true,
            office: { select: { id: true, name: true } }
          }
        },
        client: { select: clientSelectSchema }
      }
    });

    if (!invoices) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusInvoice.count({ where });
    const pagination = { total: total || 0, count: invoices?.length || 0 };

    return NextResponse.json({ valid: true, data: invoices, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['billing.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:billing', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    const clientId = parseInt(data.client_id);
    const invoiceType = data.type as InvoiceType;
    const paymentCondition = data.payment_condition as InvoicePaymentCondition;
    const baseCurrency = data.currency as Currency;
    const lines = data.lines;
    const payments = data.payments;

    // validate if admin has open cash register
    const cashRegister = await getOpenCashRegister(admin.id);
    if (!cashRegister) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noOpenCash }, { status: 400 });
    }

    // validate currency
    if (!Object.values(Currency).includes(baseCurrency)) {
      return NextResponse.json({ valid: false, message: textT?.errors?.invalidCurrency }, { status: 400 });
    }

    // get configuration
    const configuration = await getConfiguration();
    if (!configuration) {
      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }

    // validate client and billing information
    const client = await prismaRead.cusClient.findUnique({
      where: { id: clientId, office_id: cashRegister.office_id }
    });
    if (!client) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noClient }, { status: 400 });
    }
    if (!isValidBillingInformation(client)) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noClientBillingInfo }, { status: 400 });
    }

    // validate lines
    const { valid: linesValid, data: linesData, errors: linesErrors } = await validateLines(lines);
    if (!linesValid) {
      return NextResponse.json(
        { valid: false, message: textT?.errors?.linesError?.replace('{{ errors }}', linesErrors?.join(', ') || '') },
        { status: 400 }
      );
    }

    // validate payments
    const { valid: paymentsValid, data: paymentsData, errors: paymentsErrors } = validatePayments(payments);
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
    const totals = calculateBillingTotal(
      linesData || [],
      baseCurrency,
      configuration.selling_exchange_rate,
      configuration.buying_exchange_rate,
      configuration.iva_percentage
    );
    const paidAmount = calculateBillingPaidAmount(
      paymentsData || [],
      baseCurrency,
      configuration.selling_exchange_rate,
      configuration.buying_exchange_rate
    );
    if (paidAmount < totals.total) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notEnoughPaidAmount }, { status: 400 });
    }

    // create invoice and send to easytax service
    const result = await withTransaction(async (tx) => {
      // 1: generate invoice variables
      const changeAmountCRC = calculateBillingChangeAmount(
        paidAmount,
        totals.total,
        baseCurrency,
        configuration.buying_exchange_rate
      );
      const mostValuablePayment = getMostValuablePayment(paymentsData || [], configuration.buying_exchange_rate);

      // 2: create invoice with lines and payments
      const invoice = await tx.cusInvoice.create({
        data: {
          cash_register_id: cashRegister.id,
          client_id: client.id,
          consecutive: `${Date.now()}`, // TODO: to be generated
          numeric_key: `${Date.now()}`, // TODO: to be generated
          type: invoiceType,
          payment_condition: paymentCondition,
          iva_percentage: configuration.iva_percentage,
          selling_exchange_rate: configuration.selling_exchange_rate,
          buying_exchange_rate: configuration.buying_exchange_rate,
          currency: baseCurrency,
          payment_method: mostValuablePayment.method,
          subtotal: totals.subtotal,
          tax: totals.taxes,
          total: totals.total,
          cash_change: changeAmountCRC,
          status: paymentCondition === InvoicePaymentCondition.CASH ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
          invoice_lines: {
            createMany: {
              data:
                linesData?.map((line) => ({
                  package_id: line.refObj.type === 'package' ? line.refObj.obj.id : undefined,
                  order_product_id: line.refObj.type === 'order_product' ? line.refObj.obj.id : undefined,
                  product_id: line.refObj.type === 'product' ? line.refObj.obj.id : undefined,
                  package_prev_state: line.refObj.type === 'package' ? line.refObj.obj.status : undefined,
                  order_product_prev_state: line.refObj.type === 'order_product' ? line.refObj.obj.status : undefined,
                  prev_payment_status: line.refObj.type !== 'product' ? line.refObj.obj.payment_status : undefined,
                  currency: line.currency,
                  quantity: line.quantity,
                  unit_price: line.unit_price,
                  total: line.total
                })) || []
            }
          },
          invoice_payments: {
            createMany: {
              data:
                paymentsData?.map((payment) => ({
                  currency: payment.currency,
                  payment_method: payment.method,
                  ref: payment.ref || '',
                  ref_bank: payment.ref_bank || '',
                  amount: payment.amount
                })) || []
            }
          }
        }
      });
      if (!invoice) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      // 3: change packages and order products payment status to PAID and delivered if applies
      const statusUpdated = await updateLineReferences(linesData || [], tx);
      if (!statusUpdated) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      // 4: validate order statuses of order products
      for (const line of linesData || []) {
        if (line.refObj.type === 'order_product') {
          // validate order status
          await validateOrderStatus(line.refObj.obj.order_id, tx);
        }
      }

      // 5: send invoice to easytax service
      // TODO: implement easytax service integration

      // 6: save log
      await tx.cusInvoiceLog.create({
        data: {
          invoice_id: invoice.id,
          administrator_id: admin.id,
          action: 'invoice.create',
          data: JSON.stringify(data)
        }
      });

      return { id: invoice.id, change: changeAmountCRC };
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
