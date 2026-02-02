import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';

import { clientSelectSchema } from '@/controllers/Client.Controller';

export const GET = withAuthApi(['orders.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';
    const payment_status = params.payment_status || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { number: { contains: search.trim(), mode: 'insensitive' } },
        { client: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { client: { identification: { contains: search.trim(), mode: 'insensitive' } } },
        { client: { email: { contains: search.trim(), mode: 'insensitive' } } },
        { products: { some: { tracking: { contains: search.trim(), mode: 'insensitive' } } } }
      ];
      if (!isNaN(parseInt(search.trim()))) {
        where['OR'].push({ client: { id: parseInt(search.trim()) } });
      }
    }

    if (status !== '') {
      where['status'] = status;
    }

    if (payment_status !== '') {
      where['payment_status'] = payment_status;
    }

    if (params.client_id) {
      where['client_id'] = parseInt(params.client_id);
    }

    // query
    const orders = await prismaRead.cusOrder.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        number: true,
        status: true,
        payment_status: true,
        created_at: true,
        client: { select: clientSelectSchema },
        _count: { select: { products: true } }
      }
    });

    if (!orders) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusOrder.count({ where });
    const pagination = { total: total || 0, count: orders?.length || 0 };

    return NextResponse.json({ valid: true, data: orders, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['orders.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();
  const number = data.number ? `${data.number}`.trim() : '';

  try {
    const result = await withTransaction(async (tx) => {
      // verify code uniqueness
      const exist = await tx.cusOrder.findFirst({
        where: { number },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.number);
      }

      // load relations
      const products = data.products?.map((p: any) => ({
        tracking: p.tracking,
        code: p.code,
        name: p.name,
        description: p.description,
        quantity: p.quantity ? parseInt(p.quantity) : 0,
        price: p.price ? parseFloat(p.price) : 0,
        service_price: p.service_price ? parseFloat(p.service_price) : 0,
        url: p.url,
        image_url: p.image_url
      }));

      const order = await tx.cusOrder.create({
        data: {
          client_id: data.client_id,
          number,
          purchase_page: data.purchase_page,
          products: { create: products }
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
          action: 'order.create',
          data: JSON.stringify(data)
        }
      });

      return order;
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
