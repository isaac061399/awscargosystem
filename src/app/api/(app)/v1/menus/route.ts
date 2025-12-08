import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { parsePopulate, parseSort } from '@libs/utils';
import { getMenuSchema } from '@controllers/Menu.Controller';

// ! use val ? parse : 0 ONLY in optional fields
const getMenusSchema = z.object({
  limit: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  offset: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  sort: z.string().optional(),
  populate: z.string().optional(),
  filter_id: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  filter_slug: z.string().optional()
});

/**
 * @swagger
 * /api/v1/menus:
 *  get:
 *    description: Get menus
 *    operationId: GetMenus
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
 *        description: relations to load (format "relation_name", "relation_name[nested_relation_name][...]"), comma separated for multiple values, valid relations (items, items[subitems])
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
 *    responses:
 *      allOf:
 *        - 200:
 *            description: Get menus success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/menus/get'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const GET = appProxy(false, async (req) => {
  const { t, i18n } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    // params validation
    const validation = validateParams(getMenusSchema, params, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    // parse query parameters
    const validSortFields = ['id', 'locale', 'slug', 'name', 'published_at', 'created_at', 'updated_at'];

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

    // populate
    let menuSchemaOptions;

    if (populate) {
      menuSchemaOptions = {
        populateItems: Boolean(populate['items']),
        populateSubitems: Boolean(populate['items[subitems]'])
      };
    }

    const menuSchema = getMenuSchema(menuSchemaOptions);

    // query
    const menus = await prismaRead.cmsMenu.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy,
      select: menuSchema
    });

    if (!menus) {
      return NextResponse.json({ valid: true, menus: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cmsMenu.count({ where });
    const pagination = { total: total || 0, count: menus.length || 0 };

    // response
    return NextResponse.json({ valid: true, menus, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
