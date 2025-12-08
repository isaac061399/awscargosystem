import { type NextRequest, NextResponse } from 'next/server';

import { getHash } from '@libs/argon2id';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { initTranslationsApi } from '@libs/translate/functions';

export const POST = async (req: NextRequest) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:auth/reset-password', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    await withTransaction(async (tx) => {
      const { password, token, userId } = data;

      // verify token
      const tokenInfo = await getTokenInfo(token, userId);

      if (!tokenInfo) {
        throw new TransactionError(400, textT?.errors?.invalidToken);
      }

      // change password
      const passwordHashed = await getHash(password);

      const result = await tx.user.update({
        where: { id: tokenInfo.user.id },
        data: { password: passwordHashed }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.general);
      }

      // remove token
      await tx.resetToken.delete({
        where: { user_id_token: { user_id: tokenInfo.user.id, token: tokenInfo.token } }
      });

      // save user log
      await tx.userLog.create({
        data: { user_id: tokenInfo.user.id, action: 'reset-password' }
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

const getTokenInfo = async (token: string, userId: string) => {
  try {
    const result = await prismaRead.resetToken.findFirst({
      where: {
        user_id: userId,
        token,
        type: 'password',
        expires: { gte: new Date().toISOString() }
      },
      select: {
        token: true,
        user: {
          select: { id: true }
        }
      }
    });

    if (!result) {
      return null;
    }

    return result;
  } catch (error) {
    console.error(`Error: ${error}`);

    return false;
  }
};
