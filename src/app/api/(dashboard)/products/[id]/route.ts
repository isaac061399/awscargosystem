import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

export const PUT = withAuthApi(['products.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:products', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      // verify code uniqueness
      const exist = await tx.cusProduct.findFirst({
        where: { code: data.code, id: { not: Number(id) } },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.code);
      }

      // update product
      const product = await tx.cusProduct.update({
        where: { id: Number(id) },
        data: {
          code: data.code,
          name: data.name,
          cabys: data.cabys,
          currency: data.currency,
          price: parseFloat(data.price),
          enabled: data.enabled
        }
      });

      if (!product) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return product;
    });

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const DELETE = withAuthApi(['products.delete'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:products', { returnObjects: true, default: {} });

  try {
    await withTransaction(async (tx) => {
      // delete product
      const result = await tx.cusProduct.delete({
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
});
