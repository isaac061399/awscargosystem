import { prismaRead } from '@libs/prisma';
import { clientSelectSchema } from './Client.Controller';

export const getPackage = async (id: number) => {
  try {
    const packageObj = await prismaRead.cusPackage.findUnique({
      where: { id },
      select: {
        id: true,
        client_id: true,
        tracking: true,
        courier_company: true,
        purchase_page: true,
        price: true,
        description: true,
        notes: true,
        billing_weight: true,
        billing_pound_fee: true,
        billing_amount: true,
        location_shelve: true,
        location_row: true,
        payment_status: true,
        status: true,
        created_at: true,
        client: { select: clientSelectSchema }
      }
    });

    if (!packageObj) {
      return;
    }

    return packageObj;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};
