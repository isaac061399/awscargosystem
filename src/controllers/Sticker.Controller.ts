import { prismaRead } from '@/libs/prisma';

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
  serviceLabel: string;
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
        address: `${pkg.client?.district?.canton?.province?.name}, ${pkg.client?.district?.canton?.name}, ${pkg.client?.district?.name}, ${pkg.client?.address}`
      },
      serviceLabel: 'ENVIO' // This could be dynamic based on package data
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
        address: `${orderProduct.order?.client?.district?.canton?.province?.name}, ${orderProduct.order?.client?.district?.canton?.name}, ${orderProduct.order?.client?.district?.name}, ${orderProduct.order?.client?.address}`
      },
      serviceLabel: 'ENVIO' // This could be dynamic based on package data
    };
  }

  return null;
};
