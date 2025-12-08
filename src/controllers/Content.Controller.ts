import type { MediaType } from '@/prisma/generated/client';
import { prismaRead } from '@libs/prisma';
import { getBucketEndpoint } from '@services/aws-s3';

const bucketEndpoint = getBucketEndpoint();

interface SchemaOptions {
  populateSeo?: boolean;
  populateCategory?: boolean;
  populatePage?: boolean;
  populateThumbnail?: boolean;
  populateImages?: boolean;
  populateCustomValues?: boolean;
}

export const getContent = async (id: number) => {
  try {
    const schemaOptions = {
      populateSeo: true,
      populateCategory: true,
      populatePage: true,
      populateThumbnail: true,
      populateImages: true,
      populateCustomValues: true
    };

    const contentSchema = getContentSchema(schemaOptions);

    const content = await prismaRead.cmsContent.findUnique({
      where: { id },
      select: contentSchema
    });

    if (!content) {
      return;
    }

    const contentFormatted = formatContent(content, schemaOptions);

    return contentFormatted;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getContentSchema = (options?: SchemaOptions) => {
  const schema: any = {
    id: true,
    locale: true,
    slug: true,
    title: true,
    subtitle: true,
    description: true,
    content: true,
    published_at: true,
    created_at: true,
    updated_at: true
  };

  if (options?.populateSeo) {
    schema.seo = {
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

  if (options?.populateCategory) {
    schema.category = {
      select: { id: true, name: true, published_at: true }
    };
  }

  if (options?.populatePage) {
    schema.page = {
      select: { id: true, name: true, published_at: true }
    };
  }

  if (options?.populateThumbnail || options?.populateImages) {
    const mediaType = [];

    if (options?.populateThumbnail) {
      mediaType.push('THUMBNAIL' as MediaType);
    }

    if (options?.populateImages) {
      mediaType.push('IMAGE' as MediaType);
    }

    schema.media = {
      orderBy: { order: 'asc' },
      where: { type: { in: mediaType } },
      select: {
        id: true,
        title: true,
        link: true,
        type: true,
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

  if (options?.populateCustomValues) {
    schema.custom_values = {
      orderBy: { order: 'asc' },
      select: {
        id: true,
        key: true,
        value: true
      }
    };
  }

  return schema;
};

export const formatContent = (content: any, schemaOptions?: SchemaOptions) => {
  const result = { ...content };

  if (schemaOptions?.populateSeo && result.seo && result.seo.media) {
    result.seo.media.src = `${bucketEndpoint}${result.seo.media.src}`;
    result.seo.media.thumbnail = `${bucketEndpoint}${result.seo.media.thumbnail}`;
  }

  delete result.media;

  if (content.media) {
    let thumbnail = null;
    const images = [];

    for (const mediaItem of content.media) {
      const mediaType = mediaItem.type;

      mediaItem.media.src = `${bucketEndpoint}${mediaItem.media.src}`;
      mediaItem.media.thumbnail = `${bucketEndpoint}${mediaItem.media.thumbnail}`;
      delete mediaItem.type;

      if (mediaType === ('THUMBNAIL' as MediaType)) {
        thumbnail = mediaItem;
      } else if (mediaType === ('IMAGE' as MediaType)) {
        images.push(mediaItem);
      }
    }

    if (schemaOptions?.populateThumbnail) {
      result.thumbnail = thumbnail;
    }

    if (schemaOptions?.populateImages) {
      result.images = images;
    }
  }

  return result;
};
