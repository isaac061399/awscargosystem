import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';

// ! use val ? parse : 0 ONLY in optional fields
const getNotificationsSchema = z.object({
  limit: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  offset: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional())
});

/**
 * @swagger
 * /api/v1/notifications:
 *  get:
 *    description: Get user notifications
 *    operationId: GetNotifications
 *    tags:
 *      - Notifications
 *    security:
 *      - ApiKey: []
 *      - AccessToken: []
 *    parameters:
 *      - $ref: '#/components/parameters/language'
 *      - in: query
 *        name: limit
 *        description: number of records
 *        schema:
 *          type: number
 *      - in: query
 *        name: offset
 *        description: records to skip
 *        schema:
 *          type: number
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Get user notifications success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/notifications/get'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const GET = appProxy(true, async (req) => {
  const { t } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    const { session } = req;

    // params validation
    const validation = validateParams(getNotificationsSchema, params, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    // filters
    const where: any = { user_id: session.id };

    // query
    const notifications = await prismaRead.appNotification.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        title: true,
        message: true,
        is_read: true,
        created_at: true
      }
    });

    if (!notifications) {
      return NextResponse.json({ valid: true, notifications: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.appNotification.count({ where });
    const pagination = { total: total || 0, count: notifications.length || 0 };

    // response
    return NextResponse.json({ valid: true, notifications, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
