import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

export const DELETE = withAuthApi(['orders.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const admin = req.session;

  try {
    await withTransaction(async (tx) => {
      // delete order
      const entry = await tx.cusOrderProduct.findFirst({
        where: { id: Number(id) },
        include: { order: true }
      });

      if (!entry) {
        throw new TransactionError(400, textT?.errors?.deleteProduct);
      }

      const result = await tx.cusOrderProduct.delete({
        where: { id: Number(id) }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.deleteProduct);
      }

      // save log
      await tx.cusOrderLog.create({
        data: {
          administrator_id: admin.id,
          action: 'order.product.delete',
          data: entry
        }
      });
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
