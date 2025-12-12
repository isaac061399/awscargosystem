import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

export const PUT = withAuthApi(['orders.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const admin = req.session;
  // const data = await req.json();

  try {
    await withTransaction(async (tx) => {
      const entry = await tx.cusOrder.findFirst({
        where: { id: Number(id) },
        include: { products: true }
      });

      if (!entry) {
        throw new TransactionError(400, textT?.errors?.status);
      }

      // validate if exist products without tracking
      const productCount = entry.products.filter((p) => !p.tracking || p.tracking === '').length;

      if (productCount > 0) {
        throw new TransactionError(400, textT?.errors?.productsWithoutTracking);
      }

      // update order
      const result = await tx.cusOrder.update({
        where: { id: Number(id) },
        data: { status: 'DELIVERED', status_date: new Date() }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.status);
      }

      // save log
      await tx.cusOrderLog.create({
        data: {
          order_id: entry.id,
          administrator_id: admin.id,
          action: 'order.delivered',
          data: JSON.stringify(entry)
        }
      });
    });

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
