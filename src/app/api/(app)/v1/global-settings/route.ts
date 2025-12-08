import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { parsePopulate } from '@libs/utils';
import { formatGlobalSettings, getGlobalSettingsSchema } from '@controllers/GlobalSettings.Controller';

const getGlobalSettingsSchemaValidation = z.object({
  populate: z.string().optional()
});

/**
 * @swagger
 * /api/v1/global-settings:
 *  get:
 *    description: Get global settings
 *    operationId: GetGlobalSettings
 *    tags:
 *      - CMS
 *    security:
 *      - ApiKey: []
 *    parameters:
 *      - $ref: '#/components/parameters/language'
 *      - in: query
 *        name: populate
 *        description: relations to load (format "relation_name", "relation_name[nested_relation_name][...]"), comma separated for multiple values
 *        schema:
 *          type: string
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Get global settings success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/global_settings/get'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const GET = appProxy(false, async (req) => {
  const { t, i18n } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    // params validation
    const validation = validateParams(getGlobalSettingsSchemaValidation, params, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    // parse query parameters
    const populate = parsePopulate(params);

    // populate
    let globalSettingsSchemaOptions;

    if (populate) {
      globalSettingsSchemaOptions = {
        populateSeo: Boolean(populate['seo']),
        populateCustomValues: Boolean(populate['custom_values'])
      };
    }

    const globalSettingsSchema = getGlobalSettingsSchema(globalSettingsSchemaOptions);

    // query
    let globalSettings = await prismaRead.cmsGlobalSettings.findUnique({
      where: { locale: i18n.language },
      select: globalSettingsSchema
    });

    if (!globalSettings) {
      return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 404 });
    }

    // if globalSettingsSchemaOptions exist, the globalSettings need to be formatted
    if (globalSettingsSchemaOptions) {
      globalSettings = formatGlobalSettings(globalSettings, globalSettingsSchemaOptions);
    }

    // response
    return NextResponse.json({ valid: true, globalSettings }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
