import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi([], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:administrators', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = { user: { enabled: true } };
    const search = params.search || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { full_name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // query
    const administrators = await prismaRead.administrator.findMany({
      take: params.limit ? parseInt(params.limit) : 10,
      skip: 0,
      where,
      orderBy: [{ id: 'asc' }],
      select: { id: true, full_name: true, email: true }
    });

    if (!administrators) {
      return NextResponse.json({ valid: true, data: [] }, { status: 200 });
    }

    return NextResponse.json({ valid: true, data: administrators }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
