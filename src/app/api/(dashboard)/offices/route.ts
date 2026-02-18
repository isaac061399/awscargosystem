import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';

export const GET = withAuthApi(['offices.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:offices', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { mailbox_prefix: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // query
    const offices = await prismaRead.cusOffice.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'asc' }],
      select: {
        id: true,
        name: true,
        mailbox_prefix: true,
        enabled: true
      }
    });

    if (!offices) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusOffice.count({ where });
    const pagination = { total: total || 0, count: offices?.length || 0 };

    return NextResponse.json({ valid: true, data: offices, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['offices.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:offices', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const office = await tx.cusOffice.create({
        data: {
          name: data.name,
          mailbox_prefix: data.mailbox_prefix,
          shelves: data.shelves,
          rows: data.rows,
          billing_number: parseInt(data.billing_number),
          billing_terminal: parseInt(data.billing_terminal),
          enabled: data.enabled
        }
      });

      if (!office) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return office;
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
