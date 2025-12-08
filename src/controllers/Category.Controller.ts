import { prismaRead } from '@libs/prisma';

import i18nConfigApp from '@/configs/i18nConfigApp';

export const getAllCategories = async () => {
  try {
    const categories = await prismaRead.cmsCategory.findMany({
      orderBy: [{ name: 'asc' }],
      select: { id: true, locale: true, name: true, published_at: true }
    });

    const response: any = i18nConfigApp.locales.reduce((acc: any, key: string) => {
      acc[key] = [];

      return acc;
    }, {});

    if (categories) {
      for (const c of categories) {
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

export const getCategory = async (id: number) => {
  try {
    const category = await prismaRead.cmsCategory.findUnique({
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
        contents: {
          orderBy: { id: 'desc' },
          select: { id: true, slug: true, title: true, published_at: true }
        }
      }
    });

    if (!category) {
      return;
    }

    return { ...category };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};
