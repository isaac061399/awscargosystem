import { NextResponse } from 'next/server';

import { validateParams, z } from '@libs/zod';
import { initTranslationsApp } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import appProxy from '@/libs/app/appProxy';
import { parsePopulate, parseSort } from '@libs/utils';
import { formatContent, getContentSchema } from '@controllers/Content.Controller';
import { getBucketEndpoint } from '@services/aws-s3';

const bucketEndpoint = getBucketEndpoint();

const validSortFields = [
  'id',
  'locale',
  'slug',
  'name',
  'title',
  'subtitle',
  'description',
  'published_at',
  'created_at',
  'updated_at'
];

// ! use val ? parse : 0 ONLY in optional fields
const getPagesSchema = z.object({
  limit: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  offset: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  sort: z.string().optional(),
  populate: z.string().optional(),
  filter_id: z.preprocess((val) => (val ? parseInt(`${val}`) : 0), z.number({ error: 'invalidType' }).optional()),
  filter_slug: z.string().optional()
});

/**
 * @swagger
 * /api/v1/pages:
 *  get:
 *    description: Get pages
 *    operationId: GetPages
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
 *        description: relations to load (format "relation_name", "relation_name[nested_relation_name][...]"), comma separated for multiple values, valid relations (seo, contents, contents[seo], contents[thumbnail], contents[images], contents[custom_values])
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
 *            description: Get pages success
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: '#/definitions/responses/pages/get'
 *        - $ref: '#/components/objects/defaultErrorResponses'
 */
export const GET = appProxy(false, async (req) => {
  const { t, i18n } = await initTranslationsApp(req);
  const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    // params validation
    const validation = validateParams(getPagesSchema, params, errorsT?.validation);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: errorsT?.validation?.errorMessage, params: validation.params },
        { status: 400 }
      );
    }

    // parse query parameters
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
    let populateSeo: any;
    let populateContents: any;
    let contentSchemaOptions: any;

    if (populate?.seo) {
      populateSeo = {
        select: {
          title: true,
          description: true,
          keywords: true,
          robots: true,
          media: {
            select: {
              id: true,
              src: true,
              thumbnail: true,
              name: true,
              size: true,
              type: true,
              width: true,
              height: true
            }
          }
        }
      };
    }

    if (populate?.contents) {
      contentSchemaOptions = {
        populateSeo: Boolean(populate['contents[seo]']),
        populateThumbnail: Boolean(populate['contents[thumbnail]']),
        populateImages: Boolean(populate['contents[images]']),
        populateCustomValues: Boolean(populate['contents[custom_values]'])
      };

      const contentSchema = getContentSchema(contentSchemaOptions);

      populateContents = {
        where: { locale: i18n.language, published_at: { lte: new Date() } },
        select: contentSchema
      };
    }

    // query
    const pages = await prismaRead.cmsPage.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy,
      select: {
        id: true,
        locale: true,
        slug: true,
        name: true,
        title: true,
        subtitle: true,
        description: true,
        published_at: true,
        created_at: true,
        updated_at: true,
        seo: populateSeo,
        contents: populateContents
      }
    });

    if (!pages) {
      return NextResponse.json({ valid: true, pages: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    // if populateSeo or contentSchemaOptions exist, the seo and contents need to be formatted
    if (contentSchemaOptions || populateSeo) {
      pages.forEach((pag: any) => {
        if (Boolean(populateSeo) && pag.seo && pag.seo.media) {
          pag.seo.media.src = `${bucketEndpoint}${pag.seo.media.src}`;
          pag.seo.media.thumbnail = `${bucketEndpoint}${pag.seo.media.thumbnail}`;
        }

        if (contentSchemaOptions) {
          pag.contents = pag.contents.map((cont: any) => formatContent(cont, contentSchemaOptions));
        }
      });
    }

    const total = await prismaRead.cmsPage.count({ where });
    const pagination = { total: total || 0, count: pages.length || 0 };

    // response
    return NextResponse.json({ valid: true, pages, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: errorsT?.general }, { status: 500 });
  }
});
