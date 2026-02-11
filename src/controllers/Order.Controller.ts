import { prismaRead, prismaWrite, Tx, withTransaction } from '@libs/prisma';
import { clientSelectSchema } from './Client.Controller';
import { InvoiceStatus, OrderStatus } from '@/prisma/generated/enums';

export const getOrder = async (id: number) => {
  try {
    const order = await prismaRead.cusOrder.findUnique({
      where: { id },
      include: {
        client: { select: clientSelectSchema },
        products: {
          orderBy: { id: 'asc' },
          include: {
            invoice_lines: {
              where: { invoice: { status: { not: InvoiceStatus.CANCELED } } },
              include: {
                invoice: { select: { id: true } }
              }
            }
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

export const getOrderDelivered = async (id: number, productIds?: number[]) => {
  try {
    const productIdFilter = productIds ? { in: productIds } : undefined;

    const order = await prismaRead.cusOrder.findUnique({
      where: { id },
      include: {
        client: { select: clientSelectSchema },
        products: {
          orderBy: { id: 'asc' },
          where: { id: productIdFilter, status: OrderStatus.DELIVERED }
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

export const validateOrderStatus = async (id: number, tx?: Tx) => {
  try {
    const prismaInstanceRead = tx ? tx : prismaRead;
    const prismaInstanceWrite = tx ? tx : prismaWrite;

    const order = await prismaInstanceRead.cusOrder.findUnique({
      where: { id },
      select: { status: true, products: true }
    });

    if (!order) {
      return false;
    }

    const allProductsHaveSamePaymentStatus = order.products.every(
      (product) => product.payment_status === order.products[0].payment_status
    );
    const allProductsHaveSameStatus = order.products.every((product) => product.status === order.products[0].status);

    if (allProductsHaveSamePaymentStatus || allProductsHaveSameStatus) {
      await prismaInstanceWrite.cusOrder.update({
        where: { id },
        data: {
          payment_status: allProductsHaveSamePaymentStatus ? order.products[0].payment_status : undefined,
          status: allProductsHaveSameStatus ? order.products[0].status : undefined,
          status_date: allProductsHaveSameStatus ? new Date() : undefined
        }
      });

      return true;
    }

    return false;
  } catch (e) {
    console.error(`Error validating order status: ${e}`);

    return false;
  }
};
