import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parse } from 'json2csv';
import moment from 'moment-timezone';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import { padStartZeros } from '@/libs/utils';
import { clientSelectSchema } from '@/controllers/Client.Controller';

export const GET = withAuthApi(['orders.list'], async (req) => {
  const { t } = await initTranslationsApi(req, ['constants']);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });
  const labelsT: any = t('constants:labels', { returnObjects: true, default: {} });

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
        { client: { email: { contains: search.trim(), mode: 'insensitive' } } }
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
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        number: true,
        purchase_page: true,
        payment_status: true,
        status: true,
        status_date: true,
        created_at: true,
        client: { select: clientSelectSchema },
        products: {
          select: {
            id: true,
            tracking: true,
            code: true,
            name: true,
            description: true,
            quantity: true,
            price: true,
            service_price: true,
            url: true,
            image_url: true
          }
        }
      }
    });

    if (!orders) {
      return NextResponse.json({}, { status: 404 });
    }

    const csvData = await formatEntries(textT?.export, labelsT, orders);

    const csv = parse(csvData.data, { fields: csvData.headers });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=orders-export.csv'
      }
    });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

const formatEntries = async (headers: any, labelsT: any, orders: any[]) => {
  const tz = (await cookies()).get('tz')?.value || 'UTC';

  return {
    headers: Object.values(headers) as string[],
    data: orders.flatMap((o) => {
      return o.products.map((p: any) => {
        return {
          [headers.id]: padStartZeros(o.id, 4),
          [headers.client_office]: o.client?.office?.name,
          [headers.client_mailbox]: `${o.client?.office?.mailbox_prefix}${o.client?.id}`,
          [headers.client_full_name]: o.client?.full_name,
          [headers.client_identification]: o.client?.identification,
          [headers.client_email]: o.client?.email,
          [headers.number]: o.number,
          [headers.purchase_page]: o.purchase_page,
          [headers.payment_status]: labelsT?.paymentStatus[o.payment_status],
          [headers.status]: labelsT?.orderStatus[o.status],
          [headers.created_at]: moment(o.created_at).tz(tz).format('YYYY-MM-DD HH:mm:ss'),
          [headers.product_tracking]: p.tracking,
          [headers.product_code]: p.code,
          [headers.product_name]: p.name,
          [headers.product_description]: p.description,
          [headers.product_quantity]: p.quantity,
          [headers.product_price]: p.price,
          [headers.product_service_price]: p.service_price,
          [headers.product_url]: p.url,
          [headers.product_image_url]: p.image_url,
          [headers.location_shelf]: p.location_shelf,
          [headers.location_row]: p.location_row,
          [headers.payment_status]: labelsT?.paymentStatus[p.payment_status],
          [headers.status]: labelsT?.orderStatus[p.status]
        };
      });
    })
  };
};
