import { prismaRead } from '@libs/prisma';
import { getBucketEndpoint } from '@services/aws-s3';

const bucketEndpoint = getBucketEndpoint();

interface SchemaOptions {
  populateSeo?: boolean;
  populateCustomValues?: boolean;
}

export const getGlobalSettings = async (locale: string) => {
  try {
    const schemaOptions = {
      populateSeo: true,
      populateCustomValues: true
    };

    const globalSettingsSchema = getGlobalSettingsSchema(schemaOptions);

    const globalSettings = await prismaRead.cmsGlobalSettings.findUnique({
      where: { locale },
      select: globalSettingsSchema
    });

    if (!globalSettings) {
      return;
    }

    const globalSettingsFormatted = formatGlobalSettings(globalSettings, schemaOptions);

    return globalSettingsFormatted;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getGlobalSettingsSchema = (options?: SchemaOptions) => {
  const schema: any = {
    id: true,
    locale: true,
    website_name: true,
    footer_text: true,
    analytics_code: true,
    contact_phone: true,
    contact_mobile: true,
    contact_email: true,
    contact_address: true,
    contact_schedule: true,
    contact_maps_url: true,
    social_facebook: true,
    social_instagram: true,
    social_twitter: true,
    social_youtube: true,
    social_whatsapp: true,
    social_linkedin: true,
    social_tiktok: true,
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

export const formatGlobalSettings = (globalSettings: any, schemaOptions?: SchemaOptions) => {
  const result = { ...globalSettings };

  if (schemaOptions?.populateSeo && result.seo && result.seo.media) {
    result.seo.media.src = `${bucketEndpoint}${result.seo.media.src}`;
    result.seo.media.thumbnail = `${bucketEndpoint}${result.seo.media.thumbnail}`;
  }

  return result;
};
