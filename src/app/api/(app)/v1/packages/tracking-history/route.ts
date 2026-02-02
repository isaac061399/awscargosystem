import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import appProxy from '@/libs/app/appProxy';
import { getClientTrackingHistory } from '@/controllers/Tracking.Controller';

// ! use val ? parse : 0 ONLY in optional fields
const getTrackingHistorySchema = z.object({
  tracking: z.string({ error: 'required' }),
  client_id: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional())
});

/**
 * @swagger
 * /api/v1/packages/tracking-history:
 *  get:
 *    description: Get tracking history
 *    operationId: GetTrackingHistory
 *    tags:
 *      - Packages
 *    security:
 *      - ApiKey: []
 *    parameters:
 *      - $ref: '#/components/parameters/language'
 *      - in: query
 *        name: tracking
 *        required: true
 *        description: tracking number to get history for
 *        schema:
 *          type: string
 *      - in: query
 *        name: client_id
 *        description: client ID to get client specific tracking history
 *        schema:
 *          type: number
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Get contents success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/packages/tracking-history/get'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const GET = appProxy(false, async (req) => {
  const { t } = await initTranslationsApp(req, ['packages']);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });
  const textT: any = t('packages:tracking-history', { returnObjects: true, default: {} });

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    // params validation
    const validation = validateParams(getTrackingHistorySchema, params, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    const tracking = params.tracking;
    const clientId = params.client_id ? parseInt(params.client_id) : undefined;

    const trackingHistory = await getClientTrackingHistory(tracking, clientId);
    const trackingHistoryFormatted = trackingHistory.map((item) => ({
      ...item,
      status_label: textT?.statuses?.[item.status] || item.status
    }));

    // response
    return NextResponse.json({ valid: true, data: trackingHistoryFormatted }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
