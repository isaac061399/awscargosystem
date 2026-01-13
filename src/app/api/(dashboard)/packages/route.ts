import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

import { clientSelectSchema } from '@/controllers/Client.Controller';

export const GET = withAuthApi(['packages.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:packages', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';
    const payment_status = params.payment_status || '';

    if (search !== '') {
      where['OR'] = [
        { tracking: { contains: search, mode: 'insensitive' } },
        { client: { full_name: { contains: search, mode: 'insensitive' } } },
        { client: { mailbox: { contains: search, mode: 'insensitive' } } },
        { client: { identification: { contains: search, mode: 'insensitive' } } },
        { client: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status !== '') {
      where['status'] = status;
    }

    if (payment_status !== '') {
      where['payment_status'] = payment_status;
    }

    if (params.client_id) {
      where['client_id'] = parseInt(params.client_id);
    }

    // query
    const packages = await prismaRead.cusPackage.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        tracking: true,
        status: true,
        payment_status: true,
        created_at: true,
        client: { select: clientSelectSchema }
      }
    });

    if (!packages) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusPackage.count({ where });
    const pagination = { total: total || 0, count: packages?.length || 0 };

    return NextResponse.json({ valid: true, data: packages, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
