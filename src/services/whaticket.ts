import axios from 'axios';

const WHATICKET_ENDPOINT = process.env.WHATICKET_ENDPOINT || '';
const WHATICKET_TOKEN = process.env.WHATICKET_TOKEN || '';
const WHATICKET_CONNECTION_ID = process.env.WHATICKET_CONNECTION_ID || '';

type SendMessageData = {
  number: string;
  name: string;
  body: string;
};

export const requestSendMessage = async (data: SendMessageData) => {
  const path = '/messages';

  const headers = {
    Authorization: `Bearer ${WHATICKET_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.request({
      method: 'post',
      url: `${WHATICKET_ENDPOINT}${path}`,
      headers,
      data: {
        whatsappId: WHATICKET_CONNECTION_ID,
        messages: [data]
      }
    });

    return { valid: true, data: response.data };
  } catch (e: any) {
    console.error(e);
    const data = e.response?.data;

    return { valid: false, data };
  }
};
