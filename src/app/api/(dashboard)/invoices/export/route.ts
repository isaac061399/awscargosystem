import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parse } from 'json2csv';
import moment from 'moment-timezone';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import { clientSelectSchema } from '@/controllers/Client.Controller';
import { InvoicePaymentCondition } from '@/prisma/generated/enums';

export const GET = withAuthApi(['invoices.list'], async (req) => {
  const { t } = await initTranslationsApi(req, ['constants']);
  const textT: any = t('api:invoices', { returnObjects: true, default: {} });
  const labelsT: any = t('constants:labels', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';
    const clientId = params.client_id || '';
    const credits = params.credits === 'true';
    const cash = params.cash === 'true';

    if (search.trim() !== '') {
      where['OR'] = [
        { number: { contains: search.trim(), mode: 'insensitive' } },
        { consecutive: { contains: search.trim(), mode: 'insensitive' } },
        { client: { id: parseInt(search.trim()) } },
        { client: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { client: { identification: { contains: search.trim(), mode: 'insensitive' } } },
        { client: { email: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    if (status !== '') {
      where['status'] = status;
    }

    if (clientId !== '') {
      where['client_id'] = parseInt(clientId);
    }

    if (credits) {
      where['payment_condition'] = { not: InvoicePaymentCondition.CASH };
    } else if (cash) {
      where['payment_condition'] = InvoicePaymentCondition.CASH;
    }

    // query
    const invoices = await prismaRead.cusInvoice.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      include: {
        cash_register: {
          select: {
            id: true,
            office: { select: { id: true, name: true } }
          }
        },
        client: { select: clientSelectSchema }
      }
    });

    if (!invoices) {
      return NextResponse.json({}, { status: 404 });
    }

    const csvData = await formatEntries(textT?.export, labelsT, invoices);

    const csv = parse(csvData.data, { fields: csvData.headers });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=invoices-export.csv'
      }
    });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

const formatEntries = async (headers: any, labelsT: any, invoices: any[]) => {
  const tz = (await cookies()).get('tz')?.value || 'UTC';

  return {
    headers: Object.values(headers) as string[],
    data: invoices.map((i: any) => {
      return {
        [headers.id]: i.id,
        [headers.cash_register_office]: i.cash_register?.office?.name,
        [headers.client_office]: i.client?.office?.name,
        [headers.client_mailbox]: `${i.client?.office?.mailbox_prefix}${i.client?.id}`,
        [headers.client_full_name]: i.client?.full_name,
        [headers.client_identification]: i.client?.identification,
        [headers.client_email]: i.client?.email,
        [headers.consecutive]: i.consecutive,
        [headers.numeric_key]: i.numeric_key,
        [headers.type]: labelsT?.invoiceType[i.type],
        [headers.payment_condition]: labelsT?.invoicePaymentCondition[i.payment_condition],
        [headers.iva_percentage]: i.iva_percentage,
        [headers.selling_exchange_rate]: i.selling_exchange_rate,
        [headers.buying_exchange_rate]: i.buying_exchange_rate,
        [headers.currency]: labelsT?.currency[i.currency],
        [headers.payment_method]: labelsT?.paymentMethod[i.payment_method],
        [headers.payment_method_ref]: i.payment_method_ref,
        [headers.subtotal]: i.subtotal,
        [headers.tax]: i.tax,
        [headers.total]: i.total,
        [headers.cash_change]: i.cash_change,
        [headers.status]: labelsT?.invoiceStatus[i.status],
        [headers.paid_at]: i.paid_at ? moment(i.paid_at).tz(tz).format('YYYY-MM-DD HH:mm:ss') : '',
        [headers.created_at]: moment(i.created_at).tz(tz).format('YYYY-MM-DD HH:mm:ss')
      };
    })
  };
};
