import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { getHashApp } from '@libs/argon2id';
import { generateTokens } from '@libs/jsonwebtoken';
import appProxy from '@/libs/app/appProxy';

import { getSessionResponse, getUserResponse } from '@helpers/apiResponse';
import { welcomeNotification } from '@helpers/emailNotifications';

const userRegisterSchema = z.object({
  name: z.string().optional(),
  email: z.email({ error: (issue) => (issue.input === undefined ? 'required' : 'invalidEmail') }),
  password: z.string({ error: 'required' })
});

/**
 * @swagger
 * /api/v1/users/register:
 *  post:
 *    description: Register user with password
 *    operationId: UserRegister
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
 *              name:
 *                type: string
 *                description: User name
 *              email:
 *                type: string
 *                description: User email
 *              password:
 *                type: string
 *                description: User password
 *    responses:
 *      allOf:
 *        - 200:
 *            description: User registration success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/provider-register/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(false, async (req) => {
  const { t, i18n } = await initTranslationsApp(req, ['users']);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });
  const textT: any = t('users:register', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    const validation = validateParams(userRegisterSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    const { user, sessionTokens } = await withTransaction(async (tx) => {
      const email = data.email.trim().toLowerCase();

      // email exist validation
      const userExist = await tx.appUser.findUnique({
        where: { email }
      });

      if (userExist) {
        throw new TransactionError(400, textT?.errors?.userExist, { email: textT?.errors?.userExist });
      }

      // create user
      const passwordHashed = await getHashApp(data.password);

      const user = await tx.appUser.create({
        data: {
          email,
          name: data.name,
          password: passwordHashed,
          enabled: true,
          email_notifications: true,
          push_notifications: true
        }
      });

      if (!user) {
        throw new TransactionError(400, errorsT?.general);
      }

      // create user session
      const sessionTokens = generateTokens({ id: user.id });

      await tx.appSession.create({
        data: {
          user_id: user.id,
          refresh_token: sessionTokens.refreshToken || ''
        }
      });

      // send email
      await welcomeNotification({ user, lang: i18n.language });

      return { user, sessionTokens };
    });

    // response
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

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
