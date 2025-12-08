import { NextResponse } from 'next/server';

import { initTranslationsApp } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { getUserResponse } from '@helpers/apiResponse';

/**
 * @swagger
 * /api/v1/users/me:
 *  get:
 *    description: Get user information
 *    operationId: UsersMe
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
 *            description: Get user information success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/users/me/get'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const GET = appProxy(true, async (req) => {
  const { t } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const { session } = req;

    const user = await prismaRead.appUser.findUnique({
      where: { id: session.id, enabled: true }
    });

    if (!user) {
      return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 400 });
    }

    // response
    return NextResponse.json({ valid: true, user: getUserResponse(user) }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
