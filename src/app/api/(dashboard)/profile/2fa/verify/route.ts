import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { verify2FACode } from '@libs/speakeasy';
import { decrypt } from '@libs/crypto';

export const POST = withAuthApi([], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:profile', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    await withTransaction(async (tx) => {
      const adminDB = await tx.administrator.findUnique({
        where: { id: admin.id },
        select: { id: true, secret_2fa: true }
      });

      if (!adminDB || !adminDB.secret_2fa) {
        throw new TransactionError(400, textT?.errors?.general);
      }

      // decrypt secret from db
      const decryptedSecret = decrypt(adminDB.secret_2fa);

      // verify code to activate 2FA
      const verified = verify2FACode(data.code, decryptedSecret);

      if (!verified) {
        throw new TransactionError(400, textT?.errors?.verification2FA);
      }

      // enable 2FA
      const result = await tx.administrator.update({
        where: { id: admin.id },
        data: { enabled_2fa: true }
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
