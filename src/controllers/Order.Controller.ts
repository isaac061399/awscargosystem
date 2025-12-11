import { prismaRead } from '@libs/prisma';
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
        status_date: true,
        created_at: true,
        client: { select: clientSelectSchema },
        products: {
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
            image_url: true
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
