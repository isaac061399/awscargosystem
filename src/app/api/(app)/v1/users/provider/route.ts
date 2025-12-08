import { NextResponse } from 'next/server';

import type { AppUser } from '@/prisma/generated/client';
import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, Tx, withTransaction } from '@libs/prisma';
import { generateTokens } from '@libs/jsonwebtoken';
import appProxy from '@/libs/app/appProxy';
import { getSessionResponse, getUserResponse } from '@helpers/apiResponse';
import { userProviders } from '@libs/constants';
import { welcomeNotification } from '@helpers/emailNotifications';

const userRegisterSchema = z.object({
  name: z.string().optional(),
  email: z.email({ error: (issue) => (issue.input === undefined ? 'required' : 'invalidEmail') }).optional(),
  provider: z.string({ error: 'required' }).refine((slug) => Object.keys(userProviders).includes(slug), {
    error: 'invalidOption'
  }),
  provider_id: z.string({ error: 'required' })
});

/**
 * @swagger
 * /api/v1/users/provider:
 *  post:
 *    description: Register user with provider
 *    operationId: UserProvider
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
 *              - provider
 *              - provider_id
 *            properties:
 *              name:
 *                type: string
 *                description: User name
 *              email:
 *                type: string
 *                description: User email
 *              provider:
 *                type: string
 *                description: User provider
 *                enum: [GOOGLE, APPLE, FACEBOOK, TWITTER]
 *              provider_id:
 *                type: string
 *                description: User provider id
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
  const textT: any = t('users:provider', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    errorsT.validation.invalidOption = errorsT.validation.invalidOption.replace(
      '{ options }',
      Object.keys(userProviders).join(', ')
    );
    const validation = validateParams(userRegisterSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (tx) => {
      let newUser = false;

      /* ************ Check if account exist ************ */

      const accountExist = await tx.appAccount.findFirst({
        where: { provider: data.provider, provider_id: data.provider_id },
        select: { id: true, user: true }
      });

      if (accountExist) {
        if (!accountExist.user.enabled) {
          // if user was disabled by administrator
          throw new TransactionError(400, textT?.errors?.invalidUser);
        }

        // response
        const response = await generateSessionResponse(accountExist.id, accountExist.user, tx);

        return response;
      }

      /* ************ If account not exist and email is not provided ************ */

      if (!data.email) {
        throw new TransactionError(400, textT?.errors?.invalidUser);
      }

      /* ************ If account not exist and email is provided  ************ */

      const email = data.email.trim().toLowerCase();

      // check user
      let user = await tx.appUser.findUnique({
        where: { email }
      });

      if (user && !user.enabled) {
        // if user was disabled by administrator
        throw new TransactionError(400, textT?.errors?.invalidUser);
      } else if (!user) {
        newUser = true;

        // create user if not exist
        user = await tx.appUser.create({
          data: { email, name: data.name, enabled: true, email_notifications: true, push_notifications: true }
        });

        if (!user) {
          throw new TransactionError(400, errorsT?.general);
        }
      }

      // create account
      const account = await tx.appAccount.create({
        data: {
          user_id: user.id,
          provider: data.provider,
          provider_id: data.provider_id
        }
      });

      if (!account) {
        throw new TransactionError(400, errorsT?.general);
      }

      if (newUser) {
        // send email
        await welcomeNotification({ user, lang: i18n.language });
      }

      // response
      const response = await generateSessionResponse(account.id, user as AppUser, tx);

      return response;
    });

    return NextResponse.json(result, { status: 200 });
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

const generateSessionResponse = async (accountId: number, user: AppUser, tx: Tx) => {
  const sessionTokens = generateTokens({ id: user.id });

  await tx.appSession.create({
    data: {
      user_id: user.id,
      account_id: accountId,
      refresh_token: sessionTokens.refreshToken || ''
    }
  });

  return {
    valid: true,
    user: getUserResponse(user),
    session: getSessionResponse(sessionTokens)
  };
};
