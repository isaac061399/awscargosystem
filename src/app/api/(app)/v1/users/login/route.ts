import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { generateTokens } from '@libs/jsonwebtoken';
import appProxy from '@/libs/app/appProxy';
import { verifyHashApp } from '@libs/argon2id';
import { getSessionResponse, getUserResponse } from '@helpers/apiResponse';

const userLoginSchema = z.object({
  email: z.email({ error: (issue) => (issue.input === undefined ? 'required' : 'invalidEmail') }),
  password: z.string({ error: 'required' })
});

/**
 * @swagger
 * /api/v1/users/login:
 *  post:
 *    description: User login
 *    operationId: UserLogin
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
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                description: User email
 *              password:
 *                type: string
 *                description: User password
 *    responses:
 *      allOf:
 *        - 200:
 *            description: User login success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/login/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(false, async (req) => {
  const { t } = await initTranslationsApp(req, ['users']);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });
  const textT: any = t('users:login', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    const validation = validateParams(userLoginSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    const email = data.email.trim().toLowerCase();

    const { user, sessionTokens } = await withTransaction(async (tx) => {
      // check user
      const user = await tx.appUser.findUnique({
        where: { email, enabled: true }
      });

      if (!user) {
        throw new TransactionError(400, textT?.errors?.invalidCredentials);
      }

      // compare password
      const passValidation = await verifyHashApp(`${user.password}`, data.password);

      if (!passValidation) {
        throw new TransactionError(400, textT?.errors?.invalidCredentials);
      }

      // create session
      const sessionTokens = generateTokens({ id: user.id });

      await tx.appSession.create({
        data: {
          user_id: user.id,
          refresh_token: sessionTokens.refreshToken || ''
        }
      });

      return { user, sessionTokens };
    });

    return NextResponse.json(
      { valid: true, user: getUserResponse(user), session: getSessionResponse(sessionTokens) },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json(
        { valid: false, message: error.message, params: error.params },
        { status: error.status }
      );
    }

    return NextResponse.json({ valid: false, message: errorsT?.generalError }, { status: 500 });
  }
});
