import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { getHashApp } from '@libs/argon2id';

import { resetPasswordNotification } from '@helpers/emailNotifications';

const resetPasswordSchema = z.object({
  code: z.string({ error: 'required' }),
  password: z.string({ error: 'required' })
});

/**
 * @swagger
 * /api/v1/users/reset-password:
 *  post:
 *    description: Reset user password
 *    operationId: ResetPassword
 *    tags:
 *      - Users
 *    security:
 *      - ApiKey: []
 *    parameters:
 *      - $ref: '#/components/parameters/language'
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - code
 *              - password
 *            properties:
 *              code:
 *                type: string
 *                description: Verification code
 *              password:
 *                type: string
 *                description: New user password
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Password reset success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/reset-password/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(false, async (req) => {
  const { t, i18n } = await initTranslationsApp(req, ['users']);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });
  const textT: any = t('users:reset-password', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    const validation = validateParams(resetPasswordSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    await withTransaction(async (tx) => {
      // code validation
      const code = await tx.appVerificationToken.findUnique({
        where: { token: data.code },
        select: { id: true, token: true, expires_at: true, user: true }
      });

      if (!code) {
        throw new TransactionError(400, textT?.errors?.invalidCode);
      }

      // expires validation
      const now = new Date().getTime();
      const expires = new Date(code.expires_at).getTime();

      if (expires < now) {
        // remove expired code
        await tx.appVerificationToken.delete({
          where: { id: code.id, type: 'password' }
        });

        throw new TransactionError(400, textT?.errors?.invalidCode);
      }

      // reset password
      const passwordHashed = await getHashApp(data.password);

      const result = await tx.appUser.update({
        where: { id: code.user.id },
        data: { password: passwordHashed }
      });

      if (!result) {
        throw new TransactionError(400, errorsT?.general);
      }

      // send email
      await resetPasswordNotification({ user: code.user, lang: i18n.language });

      // remove used code
      await tx.appVerificationToken.delete({
        where: { id: code.id }
      });
    });

    // response
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json(
        { valid: false, message: error.message, params: error.params },
        { status: error.status }
      );
    }

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
