import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

export const PUT = withAuthApi(['pages.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:pages', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const exist = await tx.cmsPage.findFirst({
        where: { NOT: { id: Number(id) }, locale: data.locale, slug: data.slug },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.slug);
      }

      // update page
      const page = await tx.cmsPage.update({
        where: { id: Number(id) },
        data: {
          locale: data.locale,
          slug: data.slug,
          name: data.name,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
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

export const DELETE = withAuthApi(['pages.delete'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:pages', { returnObjects: true, default: {} });

  try {
    await withTransaction(async (tx) => {
      // delete page
      const result = await tx.cmsPage.delete({
        where: { id: Number(id) }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.delete);
      }
    });

    // clean cache
    await cleanCache(['/pages', '/contents']);

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 500 });
  }
});
