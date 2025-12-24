import { prismaRead } from '@libs/prisma';

export const getProduct = async (id: number) => {
  try {
    const product = await prismaRead.cusProduct.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        cabys: true,
        price: true,
        enabled: true
      }
    });

    if (!product) {
      return;
    }

    return product;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};
