import { prismaRead } from '@libs/prisma';

export const getAllRoles = async () => {
  try {
    const roles = await prismaRead.role.findMany({
      select: { id: true, name: true }
    });

    return roles || [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return [];
  }
};

export const getRole = async (id: number) => {
  try {
    const role = await prismaRead.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true
      }
    });

    if (!role) {
      return;
    }

    return { ...role, permissions: role.permissions.map((p) => p.permission_id) };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};
