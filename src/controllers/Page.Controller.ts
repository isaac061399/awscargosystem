import { prismaRead } from '@libs/prisma';
import { getBucketEndpoint } from '@services/aws-s3';

import i18nConfigApp from '@/configs/i18nConfigApp';

const bucketEndpoint = getBucketEndpoint();

export const getAllPages = async () => {
  try {
    const pages = await prismaRead.cmsPage.findMany({
      orderBy: [{ name: 'asc' }],
      select: { id: true, locale: true, name: true, published_at: true }
    });

    const response: any = i18nConfigApp.locales.reduce((acc: any, key: string) => {
      acc[key] = [];

      return acc;
    }, {});

    if (pages) {
      for (const c of pages) {
        response[c.locale].push({ id: c.id, name: c.name, published_at: c.published_at });
      }
    }

    return response;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return [];
  }
};

export const getPage = async (id: number) => {
  try {
    const page = await prismaRead.cmsPage.findUnique({
      where: { id },
      select: {
        id: true,
        locale: true,
        slug: true,
        name: true,
        title: true,
        subtitle: true,
        description: true,
        published_at: true,
        seo: {
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
        },
        contents: {
          orderBy: { id: 'desc' },
          select: { id: true, slug: true, title: true, published_at: true }
        }
      }
    });

    if (!page) {
      return;
    }

    if (page.seo && page.seo.media) {
      page.seo.media.src = `${bucketEndpoint}${page.seo.media.src}`;
      page.seo.media.thumbnail = `${bucketEndpoint}${page.seo.media.thumbnail}`;
    }

    return { ...page };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};
