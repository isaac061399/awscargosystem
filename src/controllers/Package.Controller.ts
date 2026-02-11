import { prismaRead } from '@libs/prisma';
import { clientSelectSchema } from './Client.Controller';
import { InvoiceStatus } from '@/prisma/generated/enums';

export const getPackage = async (id: number) => {
  try {
    const packageObj = await prismaRead.cusPackage.findUnique({
      where: { id },
      include: {
        client: { select: clientSelectSchema },
        invoice_lines: {
          where: { invoice: { status: { not: InvoiceStatus.CANCELED } } },
          include: {
            invoice: { select: { id: true } }
          }
        }
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
