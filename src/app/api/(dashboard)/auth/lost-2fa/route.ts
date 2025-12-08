import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { TransactionError, withTransaction } from '@libs/prisma';
import { initTranslationsApi } from '@libs/translate/functions';
import { sendEmail } from '@helpers/email';

const expirationTimeHours = 12; // hours

export const POST = async (req: NextRequest) => {
  const { t, i18n } = await initTranslationsApi(req);
  const textT: any = t('api:auth/lost-2fa', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    await withTransaction(async (tx) => {
      const { email } = data;

      const user = await tx.user.findUnique({
        where: { email: email?.trim()?.toLowerCase() }
      });

      if (!user) {
        return;
      }

      const token = uuidv4();
      const expires = Date.now() + expirationTimeHours * 60 * 60 * 1000;

      const resetToken = await tx.resetToken.create({
        data: {
          user_id: user.id,
          token,
          type: '2fa',
          expires: new Date(expires).toISOString()
        }
      });

      if (!resetToken) {
        throw new TransactionError(400, textT?.errors?.general);
      }

      // save user log
      await tx.userLog.create({
        data: { user_id: user.id, action: 'lost-2fa' }
      });

      // send the email
      await sendEmail({
        to: user.email,
        lang: i18n.language,
        template: 'lost-2fa',
        replaceData: {
          name: user.name,
          resetLink: `${process.env.NEXTAUTH_URL}/auth/reset-2fa/${token}/${user.id}`,
          expirationTime: expirationTimeHours
        }
      });
    });

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
};
