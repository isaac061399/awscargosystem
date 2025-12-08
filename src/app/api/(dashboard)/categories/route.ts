import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

export const GET = withAuthApi(['categories.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:categories', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const locale = params.locale || '';
    const search = params.s || '';

    if (locale !== '') {
      where.locale = locale;
    }

    if (search !== '') {
      where['OR'] = [
        { slug: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // query
    const categories = await prismaRead.cmsCategory.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        locale: true,
        published_at: true
      }
    });

    if (!categories) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cmsCategory.count({ where });
    const pagination = { total: total || 0, count: categories?.length || 0 };

    return NextResponse.json({ valid: true, data: categories, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['categories.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:categories', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const exist = await tx.cmsCategory.findFirst({
        where: { locale: data?.locale, slug: data?.slug },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.slug);
      }

      const category = await tx.cmsCategory.create({
        data: {
          locale: data?.locale,
          slug: data?.slug,
          name: data?.name,
          title: data?.title,
          subtitle: data?.subtitle,
          description: data?.description
        }
      });

      if (!category) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return category;
    });

    // clean cache
    await cleanCache(['/categories', '/contents']);

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
