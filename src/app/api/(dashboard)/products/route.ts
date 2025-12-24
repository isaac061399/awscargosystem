import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';

export const GET = withAuthApi(['products.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:products', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';

    if (search !== '') {
      where['OR'] = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { cabys: { contains: search, mode: 'insensitive' } }
      ];
    }

    // query
    const products = await prismaRead.cusProduct.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        cabys: true,
        price: true,
        enabled: true
      }
    });

    if (!products) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusProduct.count({ where });
    const pagination = { total: total || 0, count: products?.length || 0 };

    return NextResponse.json({ valid: true, data: products, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['products.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:products', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      // verify code uniqueness
      const exist = await tx.cusProduct.findFirst({
        where: { code: data.code },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.code);
      }

      // create product
      const product = await tx.cusProduct.create({
        data: {
          code: data.code,
          name: data.name,
          cabys: data.cabys,
          price: parseFloat(data.price),
          enabled: data.enabled
        }
      });

      if (!product) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return product;
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
