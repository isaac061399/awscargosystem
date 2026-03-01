import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { OrderStatus } from '@/prisma/generated/enums';
import { validateOrderStatus } from '@/controllers/Order.Controller';

export const PUT = withAuthApi(['orders.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    const productIds: number[] = data.product_ids;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noProductsSelected }, { status: 400 });
    }

    await withTransaction(async (tx) => {
      // validate entry
      const entry = await tx.cusOrder.findFirst({
        where: { id: Number(id) },
        include: {
          products: {
            where: { id: { in: productIds }, status: OrderStatus.READY }
          }
        }
      });
      if (!entry) {
        throw new TransactionError(400, textT?.errors?.deliver);
      }

      if (entry.products.length !== productIds.length) {
        throw new TransactionError(400, textT?.errors?.someProductsNotDelivered);
      }

      // update products status
      const updateResult = await tx.cusOrderProduct.updateMany({
        where: { id: { in: productIds } },
        data: { status: OrderStatus.DELIVERED, status_date: new Date() }
      });

      if (!updateResult.count || updateResult.count !== productIds.length) {
        throw new TransactionError(400, textT?.errors?.deliver);
      }

      // validate order status
      await validateOrderStatus(entry.id, tx);

      // save log
      await tx.cusOrderLog.create({
        data: {
          order_id: entry.id,
          administrator_id: admin.id,
          action: 'order.products.delivered',
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

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
