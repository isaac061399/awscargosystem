import { prismaRead } from '@libs/prisma';

export const getDashboardData = async () => {
  const result = {
    statistics: await getStatistics(),
    admins: await getAdmins()
  };

  return result;
};

const getStatistics = async () => {
  try {
    const result = await Promise.all([
      prismaRead.cmsPage.count(),
      prismaRead.cmsCategory.count(),
      prismaRead.cmsContent.count(),
      prismaRead.cmsMenu.count()
    ]);

    const data = {
      pages: result[0],
      categories: result[1],
      contents: result[2],
      menus: result[3]
    };

    return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return { pages: 0, categories: 0, contents: 0, menus: 0 };
  }
};

const getAdmins = async () => {
  try {
    const admins = await prismaRead.administrator.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        email: true,
        enabled_2fa: true,
        role: { select: { id: true, name: true } },
        user: { select: { id: true, enabled: true } }
      }
    });

    return admins;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
