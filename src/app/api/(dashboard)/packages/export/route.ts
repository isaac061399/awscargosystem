import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parse } from 'json2csv';
import moment from 'moment-timezone';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import { clientSelectSchema } from '@/controllers/Client.Controller';

export const GET = withAuthApi(['packages.list'], async (req) => {
  const { t } = await initTranslationsApi(req, ['constants']);
  const textT: any = t('api:packages', { returnObjects: true, default: {} });
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
    const packages = await prismaRead.cusPackage.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        tracking: true,
        courier_company: true,
        purchase_page: true,
        price: true,
        description: true,
        notes: true,
        billing_weight: true,
        billing_pound_fee: true,
        billing_amount: true,
        location_shelf: true,
        location_row: true,
        payment_status: true,
        status: true,
        created_at: true,
        client: { select: clientSelectSchema }
      }
    });

    if (!packages) {
      return NextResponse.json({}, { status: 404 });
    }

    const csvData = await formatEntries(textT?.export, labelsT, packages);

    const csv = parse(csvData.data, { fields: csvData.headers });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=packages-export.csv'
      }
    });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

const formatEntries = async (headers: any, labelsT: any, packages: any[]) => {
  const tz = (await cookies()).get('tz')?.value || 'UTC';

  return {
    headers: Object.values(headers) as string[],
    data: packages.map((p: any) => {
      return {
        [headers.id]: p.id,
        [headers.client_office]: p.client?.office?.name,
        [headers.client_mailbox]: `${p.client?.office?.mailbox_prefix}${p.client?.id}`,
        [headers.client_full_name]: p.client?.full_name,
        [headers.client_identification]: p.client?.identification,
        [headers.client_email]: p.client?.email,
        [headers.tracking]: p.tracking,
        [headers.courier_company]: p.courier_company,
        [headers.purchase_page]: p.purchase_page,
        [headers.price]: p.price,
        [headers.description]: p.description,
        [headers.notes]: p.notes,
        [headers.billing_weight]: p.billing_weight,
        [headers.billing_pound_fee]: p.billing_pound_fee,
        [headers.billing_amount]: p.billing_amount,
        [headers.location_shelf]: p.location_shelf,
        [headers.location_row]: p.location_row,
        [headers.payment_status]: labelsT?.paymentStatus[p.payment_status],
        [headers.status]: labelsT?.packageStatus[p.status],
        [headers.created_at]: moment(p.created_at).tz(tz).format('YYYY-MM-DD HH:mm:ss')
      };
    })
  };
};
