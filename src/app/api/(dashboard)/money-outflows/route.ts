import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
// import { isAdminCashRegisterOpen } from '@/controllers/CashRegister.Controller';

export const GET = withAuthApi(['money-outflows.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:money-outflows', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';

    if (search !== '') {
      where['OR'] = [
        { administrator: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { administrator: { email: { contains: search.trim(), mode: 'insensitive' } } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // query
    const moneyOutflows = await prismaRead.cusMoneyOutflow.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        currency: true,
        amount: true,
        description: true,
        method: true,
        created_at: true,
        administrator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!moneyOutflows) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusMoneyOutflow.count({ where });
    const pagination = { total: total || 0, count: moneyOutflows?.length || 0 };

    return NextResponse.json({ valid: true, data: moneyOutflows, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['money-outflows.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:money-outflows', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    // validate if admin has open cash register
    // const isCashOpen = await isAdminCashRegisterOpen(admin.id);

    // if (!isCashOpen) {
    //   return NextResponse.json({ valid: false, message: textT?.errors?.noOpenCash }, { status: 400 });
    // }

    const result = await withTransaction(async (tx) => {
      const moneyOutflow = await tx.cusMoneyOutflow.create({
        data: {
          administrator_id: admin.id,
          currency: data.currency,
          amount: parseFloat(data.amount),
          description: data.description,
          method: data.method
        }
      });

      if (!moneyOutflow) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      // save log
      await tx.cusMoneyOutflowLog.create({
        data: {
          money_outflow_id: moneyOutflow.id,
          administrator_id: admin.id,
          action: 'money-outflow.create',
          data: JSON.stringify(moneyOutflow)
        }
      });

      return moneyOutflow;
    });

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
