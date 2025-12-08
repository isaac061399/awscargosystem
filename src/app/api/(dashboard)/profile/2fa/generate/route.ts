import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { generate2FASecret } from '@libs/speakeasy';
import { encrypt } from '@libs/crypto';

import siteConfig from '@/configs/siteConfig';

export const GET = withAuthApi([], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:profile', { returnObjects: true, default: {} });

  const admin = req.session;

  try {
    // generate secret and qrcode
    const { qrcode, secret } = await generate2FASecret(`${siteConfig.siteName}:${admin.email}`);

    // encrypt secret to store in db
    const encryptedSecret = encrypt(secret);

    await withTransaction(async (tx) => {
      // save secret to verify later, enable 2FA until verification
      const result = await tx.administrator.update({
        where: { id: admin.id },
        data: { secret_2fa: encryptedSecret }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.general);
      }
    });

    return NextResponse.json({ valid: true, qrcode, secret }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
