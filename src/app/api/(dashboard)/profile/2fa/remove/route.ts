import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { verifyHash } from '@libs/argon2id';

export const POST = withAuthApi([], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:profile', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    await withTransaction(async (tx) => {
      // get user
      const user = await tx.user.findUnique({
        where: { email: admin.email },
        select: { id: true, password: true }
      });

      if (!user) {
        throw new TransactionError(400, textT?.errors?.password);
      }

      // verify password
      const passValidation = await verifyHash(`${user.password}`, data.password);

      if (!passValidation) {
        throw new TransactionError(400, textT?.errors?.password);
      }

      const result = await tx.administrator.update({
        where: { id: admin.id },
        data: { enabled_2fa: false, secret_2fa: null }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.general);
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
