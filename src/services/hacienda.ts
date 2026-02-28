import axios from 'axios';
import { billingDefaultActivityCode } from '../libs/constants';

const endpoint = process.env.HACIENDA_ENDPOINT;

const config = {
  headers: {
    'Content-Type': 'application/json'
  },
  urls: {
    activityCodes: `${endpoint}/fe/ae`
  }
};

export const getActivityCodes = async (identification: string): Promise<{ code: string; description: string }[]> => {
  try {
    const response = await axios.request({
      method: 'get',
      url: config.urls.activityCodes,
      timeout: 5000, // 5 seconds
      headers: config.headers,
      params: {
        identificacion: identification
      }
    });

    let codes = [{ code: billingDefaultActivityCode, description: 'Default' }];

    if (response?.data?.actividades && Array.isArray(response.data.actividades)) {
      codes = codes.concat(
        response.data.actividades.map((activity: any) => ({
          code: activity.codigo,
          description: activity.descripcion
        }))
      );
    }

    return codes;
  } catch (e: any) {
    console.error(`Error fetching activity codes for identification ${identification}:`, e);

    return [{ code: billingDefaultActivityCode, description: 'Default' }];
  }
};
