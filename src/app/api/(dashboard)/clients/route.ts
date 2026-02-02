import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { getMailbox } from '@/controllers/Client.Controller';

export const GET = withAuthApi(['clients.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:clients', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { full_name: { contains: search.trim(), mode: 'insensitive' } },
        { identification: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
      if (!isNaN(parseInt(search.trim()))) {
        where['OR'].push({ id: parseInt(search.trim()) });
      }
    }

    if (status !== '') {
      where['status'] = status;
    }

    // query
    const clients = await prismaRead.cusClient.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        // mailbox: true,
        full_name: true,
        identification_type: true,
        identification: true,
        email: true,
        status: true,
        created_at: true,
        office: { select: { id: true, name: true, mailbox_prefix: true } }
      }
    });

    if (!clients) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusClient.count({ where });
    const pagination = { total: total || 0, count: clients?.length || 0 };

    return NextResponse.json({ valid: true, data: clients, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['clients.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:clients', { returnObjects: true, default: {} });

  const data = await req.json();
  const identification = data.identification ? `${data.identification}`.trim() : '';
  const email = data.email ? `${data.email}`.trim().toLowerCase() : '';

  try {
    const result = await withTransaction(async (tx) => {
      // data validation
      const orFilters: any[] = [];

      if (identification !== '') orFilters.push({ identification });
      if (email !== '') orFilters.push({ email });

      if (orFilters.length > 0) {
        const exist = await tx.cusClient.findFirst({
          where: { OR: orFilters },
          select: { email: true, identification: true }
        });

        if (exist) {
          if (identification !== '' && exist.identification === identification) {
            throw new TransactionError(400, textT?.errors?.identification);
          }

          if (email !== '' && exist.email === email) {
            throw new TransactionError(400, textT?.errors?.email);
          }
        }
      }

      const useSameBilling = data.use_same_billing || false;

      if (useSameBilling) {
        data.billing_full_name = data.full_name;
        data.billing_identification_type = data.identification_type;
        data.billing_identification = identification;
        data.billing_email = email;
        data.billing_phone = data.phone;
        data.billing_district_id = data.district_id;
        data.billing_address = data.address;
      }

      // save data
      const client = await tx.cusClient.create({
        data: {
          office_id: data.office_id,
          // mailbox: data.mailbox,
          full_name: data.full_name,
          identification_type: data.identification_type,
          identification,
          email,
          phone: data.phone,
          notes: data.notes,
          district_id: data.district_id === '' ? null : data.district_id,
          address: data.address,
          password: '',
          billing_full_name: data.billing_full_name,
          billing_identification_type: data.billing_identification_type,
          billing_identification: data.billing_identification,
          billing_email: data.billing_email,
          billing_phone: data.billing_phone,
          billing_district_id: data.billing_district_id === '' ? null : data.billing_district_id,
          billing_address: data.billing_address,
          billing_activity_code: data.billing_activity_code,
          pound_fee: parseFloat(data.pound_fee),
          status: data.status
        }
      });

      if (!client) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      const mailbox = getMailbox(client.id);

      await tx.cusClient.update({
        where: { id: client.id },
        data: { mailbox: mailbox }
      });

      return client;
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
