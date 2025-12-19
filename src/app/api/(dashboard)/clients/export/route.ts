import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parse } from 'json2csv';
import moment from 'moment-timezone';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi(['clients.list'], async (req) => {
  const { t } = await initTranslationsApi(req, ['constants']);
  const textT: any = t('api:clients', { returnObjects: true, default: {} });
  const labelsT: any = t('constants:labels', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';

    if (search !== '') {
      where['OR'] = [
        { full_name: { contains: search.trim(), mode: 'insensitive' } },
        { identification: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    if (status !== '') {
      where['status'] = status;
    }

    // query
    const clients = await prismaRead.cusClient.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        office_id: true,
        box_number: true,
        full_name: true,
        identification_type: true,
        identification: true,
        email: true,
        phone: true,
        address: true,
        billing_full_name: true,
        billing_identification_type: true,
        billing_identification: true,
        billing_email: true,
        billing_phone: true,
        billing_address: true,
        billing_activity_code: true,
        pound_fee: true,
        status: true,
        created_at: true,
        office: {
          select: {
            id: true,
            name: true
          }
        },
        district: {
          select: {
            id: true,
            name: true,
            canton: {
              select: {
                id: true,
                name: true,
                province: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        billing_district: {
          select: {
            id: true,
            name: true,
            canton: {
              select: {
                id: true,
                name: true,
                province: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });

    if (!clients) {
      return NextResponse.json({}, { status: 404 });
    }

    const csvData = await formatEntries(textT?.export, labelsT, clients);

    const csv = parse(csvData.data, { fields: csvData.headers });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=clients-export.csv'
      }
    });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

const formatEntries = async (headers: any, labelsT: any, clients: any[]) => {
  const tz = (await cookies()).get('tz')?.value || 'UTC';

  return {
    headers: Object.values(headers) as string[],
    data: clients.map((c) => {
      return {
        [headers.id]: c.id,
        [headers.office]: c.office.name,
        [headers.box_number]: c.box_number,
        [headers.full_name]: c.full_name,
        [headers.identification_type]: labelsT?.identificationType[c.identification_type],
        [headers.identification]: c.identification,
        [headers.email]: c.email,
        [headers.phone]: c.phone,
        [headers.notes]: c.notes,
        [headers.province]: c.district?.canton?.province?.name,
        [headers.canton]: c.district?.canton?.name,
        [headers.district]: c.district?.name,
        [headers.address]: c.address,
        [headers.billing_full_name]: c.billing_full_name,
        [headers.billing_identification_type]: labelsT?.identificationType[c.billing_identification_type],
        [headers.billing_identification]: c.billing_identification,
        [headers.billing_email]: c.billing_email,
        [headers.billing_phone]: c.billing_phone,
        [headers.billing_province]: c.billing_district?.canton?.province?.name,
        [headers.billing_canton]: c.billing_district?.canton?.name,
        [headers.billing_district]: c.billing_district?.name,
        [headers.billing_address]: c.billing_address,
        [headers.billing_activity_code]: c.billing_activity_code,
        [headers.pound_fee]: c.pound_fee,
        [headers.status]: labelsT?.clientStatus[c.status],
        [headers.created_at]: moment(c.created_at).tz(tz).format('YYYY-MM-DD HH:mm:ss')
      };
    })
  };
};
