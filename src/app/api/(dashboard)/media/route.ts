import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { getBucketEndpoint } from '@services/aws-s3';

const bucketEndpoint = getBucketEndpoint();

export const GET = withAuthApi(['media.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:media', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';

    if (search.trim() !== '') {
      where['OR'] = [{ name: { contains: search.trim(), mode: 'insensitive' } }];
    }

    // query
    const media = await prismaRead.cmsMedia.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ updated_at: 'desc' }],
      select: {
        id: true,
        src: true,
        thumbnail: true,
        name: true,
        size: true,
        type: true,
        width: true,
        height: true,
        updated_at: true
      }
    });

    if (!media) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cmsMedia.count({ where });
    const pagination = { total: total || 0, count: media?.length || 0 };

    const data = media.map((item) => ({
      ...item,
      src: `${bucketEndpoint}${item.src}`,
      thumbnail: `${bucketEndpoint}${item.thumbnail}`
    }));

    return NextResponse.json({ valid: true, data, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['media.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:media', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const media = await tx.cmsMedia.create({
        data: {
          src: data?.src,
          thumbnail: data?.thumbnail,
          name: data?.name,
          size: data?.size,
          type: data?.type,
          width: data?.width,
          height: data?.height
        }
      });

      if (!media) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return media;
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
