import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

export const DELETE = withAuthApi(
  ['push-messages.delete'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:push-messages', { returnObjects: true, default: {} });

    try {
      await withTransaction(async (tx) => {
        const result = await tx.appTopicNotification.delete({
          where: { id: Number(id) }
        });

        if (!result) {
          throw new TransactionError(400, textT?.errors?.delete);
        }
      });

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
