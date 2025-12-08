import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

export const PUT = withAuthApi(['categories.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:categories', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const exist = await tx.cmsCategory.findFirst({
        where: { NOT: { id: Number(id) }, locale: data?.locale, slug: data?.slug },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.slug);
      }

      // update category
      const category = await tx.cmsCategory.update({
        where: { id: Number(id) },
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

export const DELETE = withAuthApi(
  ['categories.delete'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:categories', { returnObjects: true, default: {} });

    try {
      await withTransaction(async (tx) => {
        // delete category
        const result = await tx.cmsCategory.delete({
          where: { id: Number(id) }
        });

        if (!result) {
          throw new TransactionError(400, textT?.errors?.delete);
        }
      });

      // clean cache
      await cleanCache(['/categories', '/contents']);

      return NextResponse.json({ valid: true }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      if (error instanceof TransactionError) {
        return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
      }

      return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 500 });
    }
  }
);
