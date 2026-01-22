import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { Currency } from '@/prisma/generated/enums';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { getOpenCashRegister } from '@/controllers/CashRegister.Controller';
import { isValidBillingInformation } from '@/controllers/Client.Controller';
import { validateLines, validatePayments } from '@/controllers/Invoice.Controller';
import { getConfiguration } from '@/controllers/Configuration.Controller';
import {
  calculateBillingChangeAmount,
  calculateBillingPaidAmount,
  calculateBillingTotal
} from '@/helpers/calculations';

export const GET = withAuthApi(['invoices.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:invoices', { returnObjects: true, default: {} });

  // const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // // filters
    // const where: any = {};
    // const search = params.s || '';

    // if (search.trim() !== '') {
    //   where['OR'] = [
    //     { administrator: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
    //     { administrator: { email: { contains: search.trim(), mode: 'insensitive' } } },
    //     { cash_register: { office: { name: { contains: search.trim(), mode: 'insensitive' } } } },
    //     { description: { contains: search.trim(), mode: 'insensitive' } }
    //   ];
    // }

    // // query
    // const moneyOutflows = await prismaRead.cusMoneyOutflow.findMany({
    //   take: params.limit ? parseInt(params.limit) : 100,
    //   skip: params.offset ? parseInt(params.offset) : 0,
    //   where,
    //   orderBy: [{ id: 'desc' }],
    //   select: {
    //     id: true,
    //     currency: true,
    //     amount: true,
    //     description: true,
    //     method: true,
    //     created_at: true,
    //     administrator: {
    //       select: {
    //         id: true,
    //         first_name: true,
    //         last_name: true,
    //         full_name: true,
    //         email: true
    //       }
    //     },
    //     cash_register: {
    //       select: {
    //         id: true,
    //         office: {
    //           select: {
    //             id: true,
    //             name: true
    //           }
    //         }
    //       }
    //     }
    //   }
    // });

    // if (!moneyOutflows) {
    //   return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    // }

    // const total = await prismaRead.cusMoneyOutflow.count({ where });
    // const pagination = { total: total || 0, count: moneyOutflows?.length || 0 };

    // return NextResponse.json({ valid: true, data: moneyOutflows, pagination }, { status: 200 });

    return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
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
    // validate if admin has open cash register
    const cashRegister = await getOpenCashRegister(admin.id);
    if (!cashRegister) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noOpenCash }, { status: 400 });
    }

    // validate currency
    const baseCurrency = data.currency as Currency;
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
      where: { id: parseInt(data.clientId), office_id: cashRegister.office_id }
    });
    if (!client) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noClient }, { status: 400 });
    }
    if (!isValidBillingInformation(client)) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noClientBillingInfo }, { status: 400 });
    }

    // validate lines
    const { valid: linesValid, data: linesData, errors: linesErrors } = await validateLines(data.lines);
    if (!linesValid) {
      return NextResponse.json(
        { valid: false, message: textT?.errors?.linesError?.replace('{{ errors }}', linesErrors?.join(', ') || '') },
        { status: 400 }
      );
    }

    // validate payments
    const { valid: paymentsValid, data: paymentsData, errors: paymentsErrors } = validatePayments(data.payments);
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
    const changeAmountCRC = calculateBillingChangeAmount(
      paidAmount,
      totals.total,
      baseCurrency,
      configuration.buying_exchange_rate
    );
    if (paidAmount < totals.total) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notEnoughPaidAmount }, { status: 400 });
    }

    // create invoice and send to easytax service
    const result = await withTransaction(async (tx) => {
      // create invoice with lines and payments
      // change packages and order products payment status to PAID and delivered if applies
      // send invoice to easytax service
      // const moneyOutflow = await tx.cusMoneyOutflow.create({
      //   data: {
      //     administrator_id: admin.id,
      //     cash_register_id: cashRegister.id,
      //     currency: data.currency,
      //     amount: parseFloat(data.amount),
      //     description: data.description,
      //     method: data.method
      //   }
      // });
      // if (!moneyOutflow) {
      //   throw new TransactionError(400, textT?.errors?.save);
      // }
      // // save log
      // await tx.cusMoneyOutflowLog.create({
      //   data: {
      //     money_outflow_id: moneyOutflow.id,
      //     administrator_id: admin.id,
      //     action: 'money-outflow.create',
      //     data: JSON.stringify(moneyOutflow)
      //   }
      // });
      // return moneyOutflow;
    });

    return NextResponse.json({ valid: true, id: result.id, change: changeAmountCRC }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
