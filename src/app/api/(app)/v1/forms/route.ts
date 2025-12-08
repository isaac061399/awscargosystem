import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { formNotifications } from '@/helpers/emailNotifications';
import { getGlobalSettings } from '@/controllers/GlobalSettings.Controller';

import i18nConfig from '@/configs/i18nConfig';

const defaultCMSLang = i18nConfig.defaultLocale;

const formSchema = z.object({
  type: z.string({ error: 'required' }),
  data: z.string({ error: 'required' }).refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);

        // must be an array
        if (!Array.isArray(parsed)) return false;

        // each item must have string label & value
        return parsed.every((item) => typeof item.label === 'string' && typeof item.value === 'string');
      } catch {
        return false;
      }
    },
    { message: 'invalidFormJSON' }
  )
});

/**
 * @swagger
 * /api/v1/forms:
 *  post:
 *    description: Send form message to contact email
 *    operationId: FormMessage
 *    tags:
 *      - CMS
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
 *              - type
 *              - data
 *            properties:
 *              type:
 *                type: string
 *                description: Form type
 *              data:
 *                type: string
 *                description: >
 *                  Form data in JSON format [{ label: string, value: string }]
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Form message sent success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/forms/post'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const POST = appProxy(false, async (req) => {
  const { t } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const data = await req.json();

    // params validation
    const validation = validateParams(formSchema, data, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    // load global settings
    const settings = await getGlobalSettings(defaultCMSLang);

    if (!settings) {
      return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 404 });
    } else if (!settings.contact_email) {
      return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 404 });
    }

    // send notifications
    const result = await formNotifications({
      lang: defaultCMSLang,
      to: settings.contact_email,
      customSiteName: settings.website_name || 'Website',
      type: data.type,
      data: JSON.parse(data.data)
    });

    if (!result.valid) {
      return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 400 });
    }

    await withTransaction(async (tx) => {
      // save form data
      await tx.cmsForm.create({
        data: {
          type: data.type,
          data: data.data
        }
      });
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
