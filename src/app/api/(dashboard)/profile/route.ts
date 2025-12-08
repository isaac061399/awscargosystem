import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

export const PUT = withAuthApi([], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:profile', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    await withTransaction(async (tx) => {
      // update admin and relations
      const result = await tx.administrator.update({
        where: { id: admin.id },
        data: {
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
          full_name: `${data.first_name.trim()} ${data.last_name.trim()}`,
          user: {
            update: {
              data: {
                name: `${data.first_name.trim()} ${data.last_name.trim()}`
              }
            }
          }
        }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.save);
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
