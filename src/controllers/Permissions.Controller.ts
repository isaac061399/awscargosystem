import { prismaRead } from '@libs/prisma';

export const getAllPermissions = async () => {
  try {
    const permissions = await prismaRead.permission.findMany({
      orderBy: { id: 'asc' }
    });

    if (!permissions) {
      return {};
    }

    const result: { [key: string]: string[] } = {};

    permissions.forEach((p) => {
      const [module, permission] = p.id.split('.');

      if (!result[module]) {
        result[module] = [permission];
      } else {
        result[module].push(permission);
      }
    });

    return result;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return {};
  }
};
