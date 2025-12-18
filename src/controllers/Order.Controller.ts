import { prismaRead, withTransaction } from '@libs/prisma';
import { clientSelectSchema } from './Client.Controller';

export const getOrder = async (id: number) => {
  try {
    const order = await prismaRead.cusOrder.findUnique({
      where: { id },
      select: {
        id: true,
        client_id: true,
        number: true,
        purchase_page: true,
        payment_status: true,
        status: true,
        created_at: true,
        client: { select: clientSelectSchema },
        products: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            tracking: true,
            code: true,
            name: true,
            description: true,
            quantity: true,
            price: true,
            service_price: true,
            url: true,
            image_url: true,
            payment_status: true,
            status: true
          }
        }
      }
    });

    if (!order) {
      return;
    }

    return order;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const validatePendingProducts = async (id: number) => {
  try {
    await withTransaction(async (tx) => {
      const pendingProducts = await tx.cusOrderProduct.findMany({
        where: {
          order_id: id,
          status: 'PENDING',
          AND: [{ tracking: { not: null } }, { tracking: { not: '' } }]
        },
        select: { id: true }
      });

      if (!pendingProducts || pendingProducts.length === 0) {
        return false;
      }

      for (const product of pendingProducts) {
        const result = await tx.cusOrderProduct.update({
          where: { id: product.id },
          data: { status: 'ON_THE_WAY', status_date: new Date() }
        });

        if (result) {
          await tx.cusOrderProductStatusLog.create({
            data: {
              order_product_id: product.id,
              status: 'ON_THE_WAY'
            }
          });
        }
      }

      return true;
    });

    return true;
  } catch (e) {
    console.error(`Error validating pending products: ${e}`);

    return false;
  }
};

export const validateOrderStatus = async (id: number) => {
  try {
    const order = await prismaRead.cusOrder.findUnique({
      where: { id },
      select: { status: true, products: true }
    });

    if (!order) {
      return false;
    }

    const allProductsHaveSameStatus = order.products.every((product) => product.status === order.products[0].status);

    if (allProductsHaveSameStatus) {
      const newStatus = order.products[0].status;
      await prismaRead.cusOrder.update({
        where: { id },
        data: { status: newStatus, status_date: new Date() }
      });

      return true;
    }

    return false;
  } catch (e) {
    console.error(`Error validating order status: ${e}`);

    return false;
  }
};
