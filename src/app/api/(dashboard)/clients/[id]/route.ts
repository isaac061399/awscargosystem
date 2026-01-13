import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

export const PUT = withAuthApi(['clients.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

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
          where: { id: { not: Number(id) }, OR: orFilters },
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

      // save data
      const client = await tx.cusClient.update({
        where: { id: Number(id) },
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
          // password: data.password,
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

export const DELETE = withAuthApi(['clients.delete'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:clients', { returnObjects: true, default: {} });

  try {
    await withTransaction(async (tx) => {
      // delete client
      const result = await tx.cusClient.delete({
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

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
