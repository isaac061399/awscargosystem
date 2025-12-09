import { prismaRead } from '@libs/prisma';

export const loadAddressData = async () => {
  try {
    const provinces = await prismaRead.cusProvince.findMany({
      select: {
        id: true,
        name: true,
        cantons: {
          select: {
            id: true,
            name: true,
            districts: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return provinces || [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return [];
  }
};
