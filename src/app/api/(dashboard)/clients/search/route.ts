import { NextResponse } from 'next/server';

import type { ClientStatus } from '@/prisma/generated/client';
import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

import { clientSelectSchema } from '@/controllers/Client.Controller';

export const GET = withAuthApi(['clients.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:clients', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = { status: { not: 'INACTIVE' as ClientStatus } };
    const search = params.search || '';

    if (search !== '') {
      where['OR'] = [
        { box_number: { contains: search.trim(), mode: 'insensitive' } },
        { full_name: { contains: search.trim(), mode: 'insensitive' } },
        { identification: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
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
