import { defaultConfigId } from '@/libs/constants';
import { prismaRead, prismaWrite } from '@libs/prisma';

export const getConfiguration = async () => {
  try {
    const configuration = await prismaRead.cusConfiguration.findUnique({
      where: { id: defaultConfigId },
      select: {
        pound_fee: true,
        iva_percentage: true,
        selling_exchange_rate: true,
        buying_exchange_rate: true,
        updated_exchange_rate: true,
        air_address_line_1: true,
        air_address_line_2: true,
        air_address_city: true,
        air_address_state: true,
        air_address_postal_code: true,
        air_address_phone: true,
        maritime_address_line_1: true,
        maritime_address_line_2: true,
        maritime_address_city: true,
        maritime_address_state: true,
        maritime_address_postal_code: true,
        maritime_address_phone: true,
        billing_name: true,
        billing_identification: true,
        billing_email: true,
        billing_phone: true,
        billing_address: true,
        billing_activity_code: true,
        billing_cabys_default: true
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
    const savedData = {
      pound_fee: data.pound_fee ? parseFloat(data.pound_fee) : 0,
      iva_percentage: data.iva_percentage ? parseFloat(data.iva_percentage) : 0,
      selling_exchange_rate: data.selling_exchange_rate ? parseFloat(data.selling_exchange_rate) : 0,
      buying_exchange_rate: data.buying_exchange_rate ? parseFloat(data.buying_exchange_rate) : 0,
      // updated_exchange_rate: new Date(),
      air_address_line_1: data.air_address_line_1 || '',
      air_address_line_2: data.air_address_line_2 || '',
      air_address_city: data.air_address_city || '',
      air_address_state: data.air_address_state || '',
      air_address_postal_code: data.air_address_postal_code || '',
      air_address_phone: data.air_address_phone || '',
      maritime_address_line_1: data.maritime_address_line_1 || '',
      maritime_address_line_2: data.maritime_address_line_2 || '',
      maritime_address_city: data.maritime_address_city || '',
      maritime_address_state: data.maritime_address_state || '',
      maritime_address_postal_code: data.maritime_address_postal_code || '',
      maritime_address_phone: data.maritime_address_phone || '',
      billing_name: data.billing_name || '',
      billing_identification: data.billing_identification || '',
      billing_email: data.billing_email || '',
      billing_phone: data.billing_phone || '',
      billing_address: data.billing_address || '',
      billing_activity_code: data.billing_activity_code || '',
      billing_cabys_default: data.billing_cabys_default || ''
    };

    const result = await prismaWrite.cusConfiguration.upsert({
      where: { id: defaultConfigId },
      update: { ...savedData },
      create: { id: defaultConfigId, ...savedData }
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
