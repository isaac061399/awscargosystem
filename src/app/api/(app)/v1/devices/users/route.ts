import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { devicePlatforms } from '@libs/constants';
import { subscribeDeviceToTopic, unsubscribeDeviceFromTopic } from '@libs/notifications';

const deviceRegisterSchema = z.object({
  device_id: z.string({ error: 'required' }),
  platform: z.string({ error: 'required' }).refine((slug) => Object.keys(devicePlatforms).includes(slug), {
    error: 'invalidOption'
  }),
  token: z.string().optional()
});

/**
 * @swagger
 * /api/v1/devices/users:
 *  post:
 *    description: Register user device
 *    operationId: UserDevice
 *    tags:
 *      - Devices
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
 *            required:
 *              - device_id
 *              - provider
 *            properties:
 *              device_id:
 *                type: string
 *                description: User device id
 *              platform:
 *                type: string
 *                description: User device platform
 *                enum: [IOS, ANDROID]
 *              token:
 *                type: string
 *                description: User device push notification token
 *    responses:
 *      allOf:
 *        - 200:
 *            description: User device registration success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/devices/users/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(true, async (req) => {
  const { t } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    const { session } = req;

    // params validation
    errorsT.validation.invalidOption = errorsT.validation.invalidOption.replace(
      '{ options }',
      Object.keys(devicePlatforms).join(', ')
    );
    const validation = validateParams(deviceRegisterSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    await withTransaction(async (tx) => {
      // check if device id exist
      const deviceExist = await tx.appDevice.findUnique({
        where: { device_id: data.device_id }
      });

      // save device data
      let device;

      if (deviceExist) {
        device = await tx.appDevice.update({
          where: { id: deviceExist.id },
          data: {
            user_id: session.id,
            device_id: data.device_id,
            push_token: data.token || undefined,
            platform: data.platform
          }
        });
      } else {
        device = await tx.appDevice.create({
          data: {
            user_id: session.id,
            device_id: data.device_id,
            push_token: data.token || undefined,
            platform: data.platform
          }
        });
      }

      if (!device) {
        throw new TransactionError(400, errorsT?.general);
      }
    });

    // manage topics in notification service
    if (data.token) {
      unsubscribeDeviceFromTopic(data.token, 'GUEST_USERS');
      subscribeDeviceToTopic(data.token, 'REGISTERED_USERS');
    }

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
