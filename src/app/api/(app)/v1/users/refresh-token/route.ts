import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { decodeRefreshToken, generateTokens } from '@libs/jsonwebtoken';
import appProxy from '@/libs/app/appProxy';

const refreshTokenSchema = z.object({
  refresh_token: z.string({ error: 'required' })
});

/**
 * @swagger
 * /api/v1/users/refresh-token:
 *  post:
 *    description: Get new access token
 *    operationId: RefreshToken
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
 *                description: Refresh token
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Access token generation success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/refresh-token/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(false, async (req) => {
  const { t } = await initTranslationsApp(req, ['users']);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });
  const textT: any = t('users:refresh-token', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    const validation = validateParams(refreshTokenSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    const { session, sessionTokens } = await withTransaction(async (tx) => {
      // token validation
      const jwtData: any = decodeRefreshToken(data.refresh_token);

      if (!jwtData) {
        throw new TransactionError(400, textT?.errors?.invalidToken);
      }

      // get user session
      const session = await tx.appSession.findUnique({
        where: { user_id: jwtData.id, refresh_token: data.refresh_token }
      });

      if (!session) {
        throw new TransactionError(400, textT?.errors?.invalidToken);
      }

      const sessionTokens = generateTokens({ id: session.user_id }, false);

      await tx.appSession.update({
        where: { id: session.id },
        data: { updated_at: new Date().toISOString() }
      });

      return { session, sessionTokens };
    });

    // response
    return NextResponse.json(
      {
        valid: true,
        session: {
          access_token: sessionTokens.accessToken,
          expires_in: sessionTokens.expiresIn,
          expires_at: new Date(Date.now() + sessionTokens.expiresIn * 1000).toISOString(),
          refresh_token: session.refresh_token
        }
      },
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
