import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parse } from 'json2csv';
import moment from 'moment-timezone';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi(['money-outflows.list'], async (req) => {
  const { t } = await initTranslationsApi(req, ['constants']);
  const textT: any = t('api:money-outflows', { returnObjects: true, default: {} });
  const labelsT: any = t('constants:labels', { returnObjects: true, default: {} });

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
        },
        cash_register: {
          select: {
            id: true,
            office: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!moneyOutflows) {
      return NextResponse.json({}, { status: 404 });
    }

    const csvData = await formatEntries(textT?.export?.headers, labelsT, moneyOutflows);

    const csv = parse(csvData.data, { fields: csvData.headers });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=money-outflows-export.csv'
      }
    });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

const formatEntries = async (headers: any, labelsT: any, transactions: any[]) => {
  const tz = (await cookies()).get('tz')?.value || 'UTC';

  return {
    headers: Object.values(headers) as string[],
    data: transactions.map((t) => {
      return {
        [headers.id]: t.id,
        [headers.administrator_name]: t.administrator?.full_name,
        [headers.administrator_email]: t.administrator?.email,
        [headers.office]: t.cash_register?.office?.name,
        [headers.currency]: labelsT?.currency[t.currency],
        [headers.amount]: t.amount,
        [headers.description]: t.description,
        [headers.method]: labelsT?.paymentMethod[t.method],
        [headers.date]: moment(t.created_at).tz(tz).format('YYYY-MM-DD HH:mm:ss')
      };
    })
  };
};
