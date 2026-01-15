import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

export const GET = withAuthApi(['menus.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:menus', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const locale = params.locale || '';
    const search = params.s || '';

    if (locale !== '') {
      where.locale = locale;
    }

    if (search.trim() !== '') {
      where['OR'] = [
        { slug: { contains: search.trim(), mode: 'insensitive' } },
        { name: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // query
    const menus = await prismaRead.cmsMenu.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        locale: true,
        published_at: true
      }
    });

    if (!menus) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cmsMenu.count({ where });
    const pagination = { total: total || 0, count: menus?.length || 0 };

    return NextResponse.json({ valid: true, data: menus, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['menus.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:menus', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const exist = await tx.cmsMenu.findFirst({
        where: { locale: data.locale, slug: data.slug },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.slug);
      }

      // load relations
      const items = data.items?.map((i: any) => ({
        title: i.title,
        url: i.url,
        target: i.target,
        order: i.order,
        subitems: {
          create:
            i.subitems?.map((si: any) => ({
              title: si.title,
              url: si.url,
              target: si.target,
              order: si.order
            })) || []
        }
      }));

      const menu = await tx.cmsMenu.create({
        data: {
          locale: data.locale,
          slug: data.slug,
          name: data.name,
          items: { create: items }
        }
      });

      if (!menu) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return menu;
    });

    // clean cache
    await cleanCache('/menus');

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
