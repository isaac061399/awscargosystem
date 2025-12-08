import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { deleteObject } from '@services/aws-s3';

const S3_BUCKET = process.env.AWS_S3_BUCKET!;

export const DELETE = withAuthApi(['media.delete'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:media', { returnObjects: true, default: {} });

  try {
    await withTransaction(async (tx) => {
      // get media
      const media = await tx.cmsMedia.findUnique({
        where: { id: Number(id) }
      });

      if (!media) {
        return;
      }

      // delete media
      const result = await tx.cmsMedia.delete({
        where: { id: media.id }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.delete);
      }

      // delete from S3
      await deleteObject(S3_BUCKET, media.src);
      await deleteObject(S3_BUCKET, media.thumbnail);
    });

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 500 });
  }
});
