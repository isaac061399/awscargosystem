import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi(['products.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:products', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = { enabled: true };
    const search = params.search || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { code: { contains: search.trim(), mode: 'insensitive' } },
        { name: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // query
    const products = await prismaRead.cusProduct.findMany({
      take: params.limit ? parseInt(params.limit) : 10,
      skip: 0,
      where,
      orderBy: [{ id: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        currency: true,
        price: true
      }
    });

    if (!products) {
      return NextResponse.json({ valid: true, data: [] }, { status: 200 });
    }

    return NextResponse.json({ valid: true, data: products }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
