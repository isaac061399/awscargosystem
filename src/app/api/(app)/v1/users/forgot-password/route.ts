import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { generateCode } from '@libs/randomstring';

import { forgotPasswordNotification } from '@helpers/emailNotifications';

const expirationTimeHours = 12; // hours

const forgotPasswordSchema = z.object({
  email: z.email({ error: (issue) => (issue.input === undefined ? 'required' : 'invalidEmail') })
});

/**
 * @swagger
 * /api/v1/users/forgot-password:
 *  post:
 *    description: Start reset password process
 *    operationId: ForgotPassword
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
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                description: User email
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Get reset password code success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/forgot-password/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(false, async (req) => {
  const { t, i18n } = await initTranslationsApp(req, ['users']);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });
  const textT: any = t('users:forgot-password', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    const validation = validateParams(forgotPasswordSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    const email = data.email.trim().toLowerCase();

    await withTransaction(async (tx) => {
      // check user
      const user = await tx.appUser.findUnique({
        where: { email, enabled: true }
      });

      if (!user) {
        throw new TransactionError(400, textT?.errors?.emailNotExist);
      }

      // create code
      const code = generateCode();
      const expires = Date.now() + expirationTimeHours * 60 * 60 * 1000;

      const token = await tx.appVerificationToken.create({
        data: {
          user_id: user.id,
          token: code,
          type: 'password',
          expires_at: new Date(expires).toISOString()
        }
      });

      if (!token) {
        throw new TransactionError(400, errorsT?.general);
      }

      // send email
      await forgotPasswordNotification({
        user,
        code: token.token,
        expirationTime: expirationTimeHours,
        lang: i18n.language
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
