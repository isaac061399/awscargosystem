import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi(['special-packages.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:special-packages', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { tracking: { contains: search.trim(), mode: 'insensitive' } },
        { client: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { client: { identification: { contains: search.trim(), mode: 'insensitive' } } },
        { client: { email: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    if (status !== '') {
      where['status'] = status;
    }

    // query
    const specialPackages = await prismaRead.cusSpecialPackage.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      include: {
        owner: { select: { id: true, full_name: true, email: true } }
      }
    });

    if (!specialPackages) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusPackage.count({ where });
    const pagination = { total: total || 0, count: specialPackages?.length || 0 };

    return NextResponse.json({ valid: true, data: specialPackages, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
