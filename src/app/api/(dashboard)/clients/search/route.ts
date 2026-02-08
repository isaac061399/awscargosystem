import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

import { clientSelectSchema } from '@/controllers/Client.Controller';
import { ClientStatus } from '@/prisma/generated/enums';
import { getOpenCashRegister } from '@/controllers/CashRegister.Controller';

export const GET = withAuthApi([], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:clients', { returnObjects: true, default: {} });

  const admin = req.session;
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = { status: { not: ClientStatus.INACTIVE } };
    const search = params.search || '';
    const is_billing = params.is_billing || false;

    if (is_billing) {
      // validate if admin has open cash register
      const cashRegister = await getOpenCashRegister(admin.id);
      if (!cashRegister) {
        return NextResponse.json({ valid: true, data: [] }, { status: 200 });
      }

      where.office_id = cashRegister.office_id;
    }

    if (search.trim() !== '') {
      where['OR'] = [
        { full_name: { contains: search.trim(), mode: 'insensitive' } },
        { identification: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
      if (!isNaN(parseInt(search.trim()))) {
        where['OR'].push({ id: parseInt(search.trim()) });
      }
    }

    // query
    const clients = await prismaRead.cusClient.findMany({
      take: params.limit ? parseInt(params.limit) : 10,
      skip: 0,
      where,
      orderBy: [{ id: 'asc' }],
      select: clientSelectSchema
    });

    if (!clients) {
      return NextResponse.json({ valid: true, data: [] }, { status: 200 });
    }

    return NextResponse.json({ valid: true, data: clients }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
