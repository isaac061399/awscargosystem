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
      let publishedAt;

      if (data?.type === 'unpublish') {
        publishedAt = null;
      } else if (data?.type === 'publishNow') {
        publishedAt = new Date().toISOString();
      } else if (data?.type === 'publishAt') {
        publishedAt = data?.value;
      }

      // update category
      const category = await tx.cmsCategory.update({
        where: { id: Number(id) },
        data: { published_at: publishedAt }
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
