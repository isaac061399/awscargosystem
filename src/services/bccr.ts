import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Moment } from 'moment';

import { additionalExchangeRate } from '../libs/constants';

const config = {
  headers: {
    'Content-Type': 'application/soap+xml; charset=utf-8'
  },
  url: process.env.BCCR_ENDPOINT,
  defaultParams: {
    Nombre: process.env.BCCR_NAME,
    SubNiveles: 'N',
    CorreoElectronico: process.env.BCCR_EMAIL,
    Token: process.env.BCCR_TOKEN
  },
  sellingExchangeRateCode: '318',
  buyingExchangeRateCode: '317'
};

export const getSellingExchangeRate = async (date: Moment): Promise<number | null> => {
  const row = await getResponseData(date, config.sellingExchangeRateCode);

  if (!row || !row['NUM_VALOR']) {
    return null;
  }

  const rate = parseFloat(parseFloat(row['NUM_VALOR']).toFixed(2));

  if (isNaN(rate)) {
    return null;
  }

  return rate + additionalExchangeRate;
};

export const getBuyingExchangeRate = async (date: Moment): Promise<number | null> => {
  const row = await getResponseData(date, config.buyingExchangeRateCode);

  if (!row || !row['NUM_VALOR']) {
    return null;
  }

  const rate = parseFloat(parseFloat(row['NUM_VALOR']).toFixed(2));

  if (isNaN(rate)) {
    return null;
  }

  return rate + additionalExchangeRate;
};

const getResponseData = async (date: Moment, indicatorCode: string): Promise<any> => {
  try {
    const response = await axios.request({
      method: 'get',
      url: config.url,
      headers: config.headers,
      params: {
        Indicador: indicatorCode,
        FechaInicio: date.format('DD/MM/YYYY'),
        FechaFinal: date.format('DD/MM/YYYY'),
        ...config.defaultParams
      }
    });

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',

      // prevent parsing strange values
      parseTagValue: true,
      trimValues: true,

      // ignore namespace prefixes
      ignoreDeclaration: true,
      removeNSPrefix: true
    });
    const parsedData = parser.parse(response.data);

    const row = parsedData?.DataSet?.diffgram?.Datos_de_INGC011_CAT_INDICADORECONOMIC?.INGC011_CAT_INDICADORECONOMIC;

    if (!row) {
      return null;
    }

    return row;
  } catch (e: any) {
    console.error(e);

    return null;
  }
};
