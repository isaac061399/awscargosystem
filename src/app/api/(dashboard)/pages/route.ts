import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

export const GET = withAuthApi(['pages.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:pages', { returnObjects: true, default: {} });

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
    const pages = await prismaRead.cmsPage.findMany({
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

    if (!pages) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cmsPage.count({ where });
    const pagination = { total: total || 0, count: pages?.length || 0 };

    return NextResponse.json({ valid: true, data: pages, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['pages.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:pages', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const exist = await tx.cmsPage.findFirst({
        where: { locale: data.locale, slug: data.slug },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.slug);
      }

      const page = await tx.cmsPage.create({
        data: {
          locale: data.locale,
          slug: data.slug,
          name: data.name,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          seo: {
            create: {
              title: data.seo_title,
              description: data.seo_description,
              media_id: data.seo_media?.id || null,
              keywords: data.seo_keywords,
              robots: data.seo_robots
            }
          }
        }
      });

      if (!page) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return page;
    });

    // clean cache
    await cleanCache(['/pages', '/contents']);

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
