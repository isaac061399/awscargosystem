import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import appProxy from '@/libs/app/appProxy';
import { supportNotifications } from '@helpers/emailNotifications';
import { settings } from '@libs/constants';

const supportSchema = z.object({
  name: z.string({ error: 'required' }),
  email: z.email({ error: (issue) => (issue.input === undefined ? 'required' : 'invalidEmail') }),
  subject: z.string({ error: 'required' }),
  message: z.string({ error: 'required' })
});

/**
 * @swagger
 * /api/v1/support:
 *  post:
 *    description: Send support message to admin
 *    operationId: SupportMessage
 *    tags:
 *      - Support
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
 *              - name
 *              - email
 *              - subject
 *              - message
 *            properties:
 *              name:
 *                type: string
 *                description: Name
 *              email:
 *                type: string
 *                description: Email
 *              subject:
 *                type: string
 *                description: Subject
 *              message:
 *                type: string
 *                description: Message
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Support message sent success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/support/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(false, async (req) => {
  const { t, i18n } = await initTranslationsApp(req);
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
    const result = await supportNotifications({
      adminEmails: settings.support_emails,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      lang: i18n.language
    });

    if (!result.valid) {
      return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 400 });
    }

    // response
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
