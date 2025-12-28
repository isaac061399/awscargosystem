import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi(['unowned-packages.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:unowned-packages', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = { found: false };
    const search = params.s || '';

    if (search !== '') {
      where['OR'] = [
        { tracking: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // query
    const unownedPackages = await prismaRead.cusUnownedPackage.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'asc' }],
      select: {
        id: true,
        tracking: true,
        description: true,
        created_at: true,
        office: { select: { id: true, name: true } }
      }
    });

    if (!unownedPackages) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusUnownedPackage.count({ where });
    const pagination = { total: total || 0, count: unownedPackages?.length || 0 };

    return NextResponse.json({ valid: true, data: unownedPackages, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
