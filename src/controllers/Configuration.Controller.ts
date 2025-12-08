import { prismaRead, prismaWrite } from '@libs/prisma';

const defaultConfigId = 1;

export const getConfiguration = async () => {
  try {
    const configuration = await prismaRead.cusConfiguration.findUnique({
      where: { id: defaultConfigId },
      select: {
        pound_fee: true,
        additional_exchange_rate: true,
        iva_percentage: true,
        address_line_1: true,
        address_line_2: true,
        address_city: true,
        address_state: true,
        address_postal_code: true,
        address_phone: true
      }
    });

    if (!configuration) {
      return;
    }

    return configuration;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const saveConfiguration = async (data: any) => {
  try {
    const result = await prismaWrite.cusConfiguration.upsert({
      where: { id: defaultConfigId },
      update: {
        pound_fee: data.pound_fee ? parseFloat(data.pound_fee) : 0,
        additional_exchange_rate: data.additional_exchange_rate ? parseFloat(data.additional_exchange_rate) : 0,
        iva_percentage: data.iva_percentage ? parseFloat(data.iva_percentage) : 0,
        address_line_1: data.address_line_1 || '',
        address_line_2: data.address_line_2 || '',
        address_city: data.address_city || '',
        address_state: data.address_state || '',
        address_postal_code: data.address_postal_code || '',
        address_phone: data.address_phone || ''
      },
      create: {
        id: defaultConfigId,
        pound_fee: data.pound_fee ? parseFloat(data.pound_fee) : 0,
        additional_exchange_rate: data.additional_exchange_rate ? parseFloat(data.additional_exchange_rate) : 0,
        iva_percentage: data.iva_percentage ? parseFloat(data.iva_percentage) : 0,
        address_line_1: data.address_line_1 || '',
        address_line_2: data.address_line_2 || '',
        address_city: data.address_city || '',
        address_state: data.address_state || '',
        address_postal_code: data.address_postal_code || '',
        address_phone: data.address_phone || ''
      }
    });

    if (!result) {
      return false;
    }

    return true;
  } catch (e) {
    console.error(`Error: ${e}`);

    return false;
  }
};
