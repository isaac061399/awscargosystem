import { NextResponse } from 'next/server';

import type { MediaType } from '@/prisma/generated/client';
import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

import { clientSelectSchema } from '@/controllers/Client.Controller';

export const GET = withAuthApi(['orders.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const locale = params.locale || '';
    const search = params.s || '';
    const status = params.status || '';
    const payment_status = params.payment_status || '';

    if (locale !== '') {
      where.locale = locale;
    }

    if (search !== '') {
      where['OR'] = [
        { number: { contains: search, mode: 'insensitive' } },
        { client: { full_name: { contains: search, mode: 'insensitive' } } },
        { client: { box_number: { contains: search, mode: 'insensitive' } } },
        { client: { identification: { contains: search, mode: 'insensitive' } } },
        { client: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status !== '') {
      where['status'] = status;
    }

    if (payment_status !== '') {
      where['payment_status'] = payment_status;
    }

    // query
    const orders = await prismaRead.cusOrder.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        number: true,
        status: true,
        payment_status: true,
        created_at: true,
        client: { select: clientSelectSchema }
      }
    });

    if (!orders) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusOrder.count({ where });
    const pagination = { total: total || 0, count: orders?.length || 0 };

    return NextResponse.json({ valid: true, data: orders, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['orders.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const exist = await tx.cusOrder.findFirst({
        where: { locale: data.locale, slug: data.slug },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.slug);
      }

      // load relations
      const media = [];

      if (data.thumbnail) {
        media.push({
          media_id: data.thumbnail?.media_id,
          title: data.thumbnail?.title,
          link: data.thumbnail?.link,
          type: 'THUMBNAIL' as MediaType,
          order: 0
        });
      }

      if (data.images) {
        for (const image of data.images) {
          media.push({
            media_id: image?.media_id,
            title: image?.title,
            link: image?.link,
            type: 'IMAGE' as MediaType,
            order: image?.order
          });
        }
      }

      const customValues = data.customValues?.map((cv: any) => ({
        key: cv.key,
        value: cv.value,
        order: cv.order
      }));

      const order = await tx.cusOrder.create({
        data: {
          locale: data.locale,
          slug: data.slug,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          order: data.order,
          seo: {
            create: {
              title: data.seo_title,
              description: data.seo_description,
              media_id: data.seo_media?.id || null,
              keywords: data.seo_keywords,
              robots: data.seo_robots
            }
          },
          category: data.category_id ? { connect: { id: Number(data.category_id) } } : undefined,
          page: data.page_id ? { connect: { id: Number(data.page_id) } } : undefined,
          media: { create: media },
          custom_values: { create: customValues }
        }
      });

      if (!order) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return order;
    });

    // clean cache
    await cleanCache(['/orders', '/categories', '/pages']);

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
