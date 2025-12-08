import { NextResponse } from 'next/server';

import type { NotificationTopic } from '@/prisma/generated/client';
import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import appProxy from '@/libs/app/appProxy';
import { sendMessage, sendMessageTopic } from '@libs/notifications';

const supportSchema = z.object({
  title: z.string({ error: 'required' }),
  message: z.string({ error: 'required' }),
  topic: z.string().optional(),
  token: z.string().optional()
});

/**
 * @swagger
 * /api/v1/notifications/test:
 *  post:
 *    description: Send test push notification
 *    operationId: NotificationTest
 *    tags:
 *      - Notifications
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
 *              - title
 *              - message
 *            properties:
 *              title:
 *                type: string
 *                description: Title
 *              message:
 *                type: string
 *                description: Message
 *              topic:
 *                type: string
 *                description: Topic
 *              token:
 *                type: string
 *                description: Device token(s) - comma separated
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Push notification sent success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/notifications/test/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(false, async (req) => {
  const { t } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    const validation = validateParams(supportSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    // send notifications
    if (data.topic && data.topic !== '') {
      data.topic.split(',').forEach(async (t: string) => {
        await sendMessageTopic(t as NotificationTopic, data.title, data.message);
      });
    }

    if (data.token && data.token !== '') {
      const tokens = data.token.split(',');

      if (tokens.length > 1) {
        await sendMessage(tokens, data.title, data.message);
      } else {
        await sendMessage(tokens[0], data.title, data.message);
      }
    }

    // response
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
