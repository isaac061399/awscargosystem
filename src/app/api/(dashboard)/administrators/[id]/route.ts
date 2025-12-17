import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { getHash } from '@libs/argon2id';

export const PUT = withAuthApi(
  ['administrators.edit'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:administrators', { returnObjects: true, default: {} });

    const data = await req.json();

    try {
      const result = await withTransaction(async (tx) => {
        let passwordHashed;

        if (data.password && data.password !== '') {
          passwordHashed = await getHash(data.password);
        }

        // update admin and relations
        const admin = await tx.administrator.update({
          where: { id: Number(id) },
          data: {
            first_name: data.first_name.trim(),
            last_name: data.last_name.trim(),
            full_name: `${data.first_name.trim()} ${data.last_name.trim()}`,
            role: {
              connect: { id: Number(data.role_id) }
            },
            user: {
              update: {
                data: {
                  name: `${data.first_name.trim()} ${data.last_name.trim()}`,
                  password: passwordHashed,
                  enabled: data.enabled
                }
              }
            },
            office: data.office_id ? { connect: { id: Number(data.office_id) } } : { disconnect: true }
          }
        });

        if (!admin) {
          throw new TransactionError(400, textT?.errors?.save);
        }

        return admin;
      });

      return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      if (error instanceof TransactionError) {
        return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
      }

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);

export const DELETE = withAuthApi(
  ['administrators.delete'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:administrators', { returnObjects: true, default: {} });

    try {
      await withTransaction(async (tx) => {
        // get user admin to delete user
        const admin = await tx.administrator.findUnique({
          where: { id: Number(id) },
          select: { id: true, email: true }
        });

        if (!admin) {
          return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 400 });
        }

        // delete admin
        const result = await tx.administrator.delete({
          where: { id: Number(id) }
        });

        if (!result) {
          return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 400 });
        }

        // delete user
        await tx.user.delete({
          where: { email: admin.email }
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
  }
);
