import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';

const userLogoutSchema = z.object({
  refresh_token: z.string({ error: 'required' })
});

/**
 * @swagger
 * /api/v1/users/logout:
 *  delete:
 *    description: User logout
 *    operationId: UserLogout
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
 *              - refresh_token
 *            properties:
 *              refresh_token:
 *                type: string
 *                description: User session refresh token
 *    responses:
 *      allOf:
 *        - 200:
 *            description: User logout success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/logout/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const DELETE = appProxy(false, async (req) => {
  const { t } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    const validation = validateParams(userLogoutSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    await withTransaction(async (tx) => {
      // check session
      const session = await tx.appSession.findFirst({
        where: { refresh_token: data.refresh_token }
      });

      if (session) {
        await tx.appSession.delete({
          where: { id: session.id }
        });
      }
    });

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
