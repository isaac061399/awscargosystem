import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

import { validateOrderStatus, validatePendingProducts } from '@/controllers/Order.Controller';

export const PUT = withAuthApi(['orders.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();
  const number = data.number ? `${data.number}`.trim() : '';

  try {
    const result = await withTransaction(async (tx) => {
      // verify code uniqueness
      const exist = await tx.cusOrder.findFirst({
        where: { number, id: { not: Number(id) } },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.number);
      }

      // create/update relations
      for (const p of data.products || []) {
        const productData = {
          tracking: p.tracking,
          code: p.code,
          name: p.name,
          description: p.description,
          quantity: p.quantity ? parseInt(p.quantity) : 0,
          price: p.price ? parseFloat(p.price) : 0,
          service_price: p.service_price ? parseFloat(p.service_price) : 0,
          url: p.url,
          image_url: p.image_url
        };

        if (p.id) {
          await tx.cusOrderProduct.update({
            where: { id: p.id },
            data: productData
          });
        } else {
          await tx.cusOrderProduct.create({
            data: {
              order_id: Number(id),
              ...productData
            }
          });
        }
      }

      // update order
      const order = await tx.cusOrder.update({
        where: { id: Number(id) },
        data: {
          client_id: data.client_id,
          number,
          purchase_page: data.purchase_page
        }
      });

      if (!order) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      // save log
      await tx.cusOrderLog.create({
        data: {
          order_id: order.id,
          administrator_id: admin.id,
          action: 'order.edit',
          data: data
        }
      });

      return order;
    });

    // await validate pending products
    await validatePendingProducts(result.id);

    // validate order status
    await validateOrderStatus(result.id);

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const DELETE = withAuthApi(['orders.delete'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const admin = req.session;

  try {
    await withTransaction(async (tx) => {
      // delete order
      const entry = await tx.cusOrder.findFirst({
        where: { id: Number(id) },
        include: { products: true }
      });

      if (!entry) {
        throw new TransactionError(400, textT?.errors?.delete);
      }

      const result = await tx.cusOrder.delete({
        where: { id: Number(id) }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.delete);
      }

      // save log
      await tx.cusOrderLog.create({
        data: {
          administrator_id: admin.id,
          action: 'order.delete',
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
