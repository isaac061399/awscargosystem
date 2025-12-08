import { prismaRead } from '@libs/prisma';

export const getAllOffices = async () => {
  try {
    const offices = await prismaRead.cusOffice.findMany({
      where: { enabled: true },
      select: { id: true, name: true, shelves: true, rows: true }
    });

    return offices || [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return [];
  }
};

export const getOffice = async (id: number) => {
  try {
    const office = await prismaRead.cusOffice.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        shelves: true,
        rows: true,
        enabled: true
      }
    });

    if (!office) {
      return;
    }

    return office;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};
