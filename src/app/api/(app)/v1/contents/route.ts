import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { parsePopulate, parseSort } from '@libs/utils';
import { formatContent, getContentSchema } from '@controllers/Content.Controller';

// ! use val ? parse : 0 ONLY in optional fields
const getContentsSchema = z.object({
  limit: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  offset: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  sort: z.string().optional(),
  populate: z.string().optional(),
  filter_id: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  filter_slug: z.string().optional(),
  filter_category_slug: z.string().optional()
});

/**
 * @swagger
 * /api/v1/contents:
 *  get:
 *    description: Get contents
 *    operationId: GetContents
 *    tags:
 *      - CMS
 *    security:
 *      - ApiKey: []
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
 *      - in: query
 *        name: sort
 *        description: sort items (format "field_name:sort_type" | examples "id:asc", "id:desc"), comma separated for multiple values
 *        schema:
 *          type: string
 *      - in: query
 *        name: populate
 *        description: relations to load (format "relation_name", "relation_name[nested_relation_name][...]"), comma separated for multiple values, valid relations (seo, thumbnail, images, custom_values)
 *        schema:
 *          type: string
 *      - in: query
 *        name: filter_id
 *        description: filter data by ID, comma separated for multiple values
 *        schema:
 *          type: number
 *      - in: query
 *        name: filter_slug
 *        description: filter data by Slug, comma separated for multiple values
 *        schema:
 *          type: string
 *      - in: query
 *        name: filter_category_slug
 *        description: filter data by Category Related Slug, comma separated for multiple values
 *        schema:
 *          type: string
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Get contents success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/contents/get'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const GET = appProxy(false, async (req) => {
  const { t, i18n } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    // params validation
    const validation = validateParams(getContentsSchema, params, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    // parse query parameters
    const validSortFields = [
      'id',
      'locale',
      'slug',
      'title',
      'subtitle',
      'description',
      'content',
      'published_at',
      'created_at',
      'updated_at'
    ];

    const orderBy = parseSort(params, validSortFields);
    const populate = parsePopulate(params);

    // filters
    const where: any = { locale: i18n.language, published_at: { lte: new Date() } };

    if (params.filter_id && params.filter_id !== '') {
      where.id = { in: params.filter_id.split(',').map((id) => parseInt(id)) };
    }

    if (params.filter_slug && params.filter_slug !== '') {
      where.slug = { in: params.filter_slug.split(',') };
    }

    if (params.filter_category_slug && params.filter_category_slug !== '') {
      where.category = { slug: { in: params.filter_category_slug.split(',') } };
    }

    // populate
    let contentSchemaOptions;

    if (populate) {
      contentSchemaOptions = {
        populateSeo: Boolean(populate['seo']),
        populateThumbnail: Boolean(populate['thumbnail']),
        populateImages: Boolean(populate['images']),
        populateCustomValues: Boolean(populate['custom_values'])
      };
    }

    const contentSchema = getContentSchema(contentSchemaOptions);

    // query
    let contents = await prismaRead.cmsContent.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy,
      select: contentSchema
    });

    if (!contents) {
      return NextResponse.json({ valid: true, contents: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    // if contentSchemaOptions exist, the contents need to be formatted
    if (contentSchemaOptions) {
      contents = contents.map((cont) => formatContent(cont, contentSchemaOptions));
    }

    const total = await prismaRead.cmsContent.count({ where });
    const pagination = { total: total || 0, count: contents.length || 0 };

    // response
    return NextResponse.json({ valid: true, contents, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
