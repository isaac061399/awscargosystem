import { boxNumberPrefix } from '@/libs/constants';
import { prismaRead } from '@libs/prisma';

export const getClient = async (id: number) => {
  try {
    const client = await prismaRead.cusClient.findUnique({
      where: { id },
      select: {
        id: true,
        office_id: true,
        box_number: true,
        full_name: true,
        identification_type: true,
        identification: true,
        email: true,
        phone: true,
        notes: true,
        address: true,
        billing_full_name: true,
        billing_identification_type: true,
        billing_identification: true,
        billing_email: true,
        billing_phone: true,
        billing_address: true,
        billing_activity_code: true,
        pound_fee: true,
        status: true,
        created_at: true,
        office: {
          select: {
            id: true,
            name: true
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

export const getBoxNumber = (id: number) => {
  return `${boxNumberPrefix}${id.toString().padStart(3, '0')}`;
};

export const clientSelectSchema = {
  id: true,
  box_number: true,
  full_name: true,
  identification_type: true,
  identification: true,
  email: true,
  office: { select: { id: true, name: true } }
};
