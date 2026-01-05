import { NextResponse } from 'next/server';

import type { MediaType } from '@/prisma/generated/client';
import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

export const PUT = withAuthApi(['contents.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:contents', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const exist = await tx.cmsContent.findFirst({
        where: { NOT: { id: Number(id) }, locale: data.locale, slug: data.slug },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.slug);
      }

      // delete relations
      await tx.cmsMediaContent.deleteMany({ where: { content_id: Number(id) } });
      await tx.cmsCustomValue.deleteMany({ where: { content_id: Number(id) } });

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

      // update content
      const content = await tx.cmsContent.update({
        where: { id: Number(id) },
        data: {
          locale: data.locale,
          slug: data.slug,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          content: data.content,
          seo: {
            upsert: {
              create: {
                title: data.seo_title,
                description: data.seo_description,
                media_id: data.seo_media?.id || null,
                keywords: data.seo_keywords,
                robots: data.seo_robots
              },
              update: {
                title: data.seo_title,
                description: data.seo_description,
                media_id: data.seo_media?.id || null,
                keywords: data.seo_keywords,
                robots: data.seo_robots
              }
            }
          },
          category: data.category_id ? { connect: { id: Number(data.category_id) } } : { disconnect: true },
          page: data.page_id ? { connect: { id: Number(data.page_id) } } : { disconnect: true },
          media: { create: media },
          custom_values: { create: customValues }
        }
      });

      if (!content) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return content;
    });

    // clean cache
    await cleanCache(['/contents', '/categories', '/pages']);

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const DELETE = withAuthApi(['contents.delete'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:contents', { returnObjects: true, default: {} });

  try {
    await withTransaction(async (tx) => {
      // delete content
      const result = await tx.cmsContent.delete({
        where: { id: Number(id) }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.delete);
      }
    });

    // clean cache
    await cleanCache(['/contents', '/categories', '/pages']);

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 500 });
  }
});
