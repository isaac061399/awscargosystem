import { prismaRead } from '@/libs/prisma';
import { getClientAddress } from '@/helpers/address';

import { clientSelectSchema } from './Client.Controller';

type Sticker = {
  tracking: string;
  location: {
    shelf: string;
    row: string;
  };
  client: {
    mailbox: string;
    name: string;
    phone: string;
    address: string;
  };
};

export const getSticker = async (tracking: string): Promise<Sticker | null> => {
  const pkg = await prismaRead.cusPackage.findUnique({
    where: { tracking },
    select: {
      tracking: true,
      location_shelf: true,
      location_row: true,
      client: {
        select: {
          ...clientSelectSchema,
          address: true,
          district: {
            select: {
              id: true,
              name: true,
              canton: {
                select: {
                  id: true,
                  name: true,
                  province: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  if (pkg) {
    return {
      tracking: pkg.tracking || '',
      location: {
        shelf: pkg.location_shelf || '',
        row: pkg.location_row || ''
      },
      client: {
        mailbox: `${pkg.client?.office?.mailbox_prefix}${pkg.client?.id}`,
        name: pkg.client?.full_name,
        phone: pkg.client?.phone || '',
        address: getClientAddress(pkg.client)
      }
    };
  }

  const orderProduct = await prismaRead.cusOrderProduct.findFirst({
    where: { tracking },
    select: {
      tracking: true,
      location_shelf: true,
      location_row: true,
      order: {
        select: {
          id: true,
          client: {
            select: {
              ...clientSelectSchema,
              address: true,
              district: {
                select: {
                  id: true,
                  name: true,
                  canton: {
                    select: {
                      id: true,
                      name: true,
                      province: {
                        select: { id: true, name: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  if (orderProduct) {
    return {
      tracking: orderProduct.tracking || '',
      location: {
        shelf: orderProduct.location_shelf || '',
        row: orderProduct.location_row || ''
      },
      client: {
        mailbox: `${orderProduct.order?.client?.office?.mailbox_prefix}${orderProduct.order?.client?.id}`,
        name: orderProduct.order.client?.full_name,
        phone: orderProduct.order.client?.phone || '',
        address: getClientAddress(orderProduct.order.client)
      }
    };
  }

  return null;
};
