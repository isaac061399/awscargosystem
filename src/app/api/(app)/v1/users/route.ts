import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { getHashApp } from '@libs/argon2id';
import appProxy from '@/libs/app/appProxy';
import { getUserResponse } from '@helpers/apiResponse';

const userUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.email({ error: (issue) => (issue.input === undefined ? 'required' : 'invalidEmail') }).optional(),
  password: z.string().optional(),
  email_notifications: z.boolean({ error: 'invalidType' }).optional(),
  push_notifications: z.boolean({ error: 'invalidType' }).optional()
});

/**
 * @swagger
 * /api/v1/users:
 *  put:
 *    description: Update user profile
 *    operationId: UserUpdateProfile
 *    tags:
 *      - Users
 *    security:
 *      - ApiKey: []
 *      - AccessToken: []
 *    parameters:
 *      - $ref: '#/components/parameters/language'
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
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
 *              email_notifications:
 *                type: boolean
 *                description: User want receive email notifications
 *              push_notifications:
 *                type: boolean
 *                description: User want receive push notifications
 *    responses:
 *      allOf:
 *        - 200:
 *            description: User update profile success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/put'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const PUT = appProxy(true, async (req) => {
  const { t } = await initTranslationsApp(req, ['users']);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });
  const textT: any = t('users:root', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    const { session } = req;

    // params validation
    const validation = validateParams(userUpdateSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (tx) => {
      const updatedParams: {
        name?: string;
        email?: string;
        password?: string;
        email_notifications?: boolean;
        push_notifications?: boolean;
      } = {
        name: data.name,
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications
      };

      // if email
      if (data.email) {
        const email = data.email.trim().toLowerCase();

        // email exist validation
        const userExist = await tx.appUser.findUnique({
          where: { NOT: { id: session.id }, email }
        });

        if (userExist) {
          throw new TransactionError(400, textT?.errors?.userExist, { email: textT?.errors?.userExist });
        }

        updatedParams.email = email;
      }

      // if password
      if (data.password) {
        const passwordHashed = await getHashApp(data.password);

        updatedParams.password = passwordHashed;
      }

      // update user
      const user = await tx.appUser.update({
        where: { id: session.id },
        data: updatedParams
      });

      if (!user) {
        throw new TransactionError(400, errorsT?.general);
      }

      return user;
    });

    // response
    return NextResponse.json({ valid: true, user: getUserResponse(result) }, { status: 200 });
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

/**
 * @swagger
 * /api/v1/users:
 *  delete:
 *    description: Delete user account and all data
 *    operationId: UserDeleteAccount
 *    tags:
 *      - Users
 *    security:
 *      - ApiKey: []
 *      - AccessToken: []
 *    parameters:
 *      - $ref: '#/components/parameters/language'
 *    responses:
 *      allOf:
 *        - 200:
 *            description: User delete account success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/delete'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const DELETE = appProxy(true, async (req) => {
  const { t } = await initTranslationsApp(req, ['users']);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const { session } = req;

    await withTransaction(async (tx) => {
      // delete user and relations
      const result = await tx.appUser.delete({
        where: { id: session.id }
      });

      if (!result) {
        throw new TransactionError(400, errorsT?.general);
      }
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
