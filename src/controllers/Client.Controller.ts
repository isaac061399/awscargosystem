import { mailboxPrefix } from '@/libs/constants';
import { CusClient } from '@/prisma/generated/client';
import { prismaRead } from '@libs/prisma';

export const getClient = async (id: number) => {
  try {
    const client = await prismaRead.cusClient.findUnique({
      where: { id },
      include: {
        office: {
          select: {
            id: true,
            name: true,
            mailbox_prefix: true
          }
        },
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
        },
        billing_district: {
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
    });

    if (!client) {
      return;
    }

    return client;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getClientSearchById = async (id: number, officeId?: number) => {
  try {
    const client = await prismaRead.cusClient.findUnique({
      where: { id, office_id: officeId },
      select: clientSelectSchema
    });

    if (!client) {
      return;
    }

    return client;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getMailbox = (id: number) => {
  return `${mailboxPrefix}${id.toString().padStart(3, '0')}`;
};

export const isValidBillingInformation = (client: CusClient) => {
  if (!client.billing_full_name || client.billing_full_name.trim() === '') {
    return false;
  }
  if (!client.billing_identification || client.billing_identification.trim() === '') {
    return false;
  }
  if (!client.billing_email || client.billing_email.trim() === '') {
    return false;
  }
  if (!client.billing_activity_code || client.billing_activity_code.trim() === '') {
    return false;
  }

  return true;
};

export const clientSelectSchema = {
  id: true,
  full_name: true,
  identification_type: true,
  identification: true,
  email: true,
  phone: true,
  office: { select: { id: true, name: true, mailbox_prefix: true } }
};
