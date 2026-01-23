import axios from 'axios';
import { Moment } from 'moment';

import { Currency, InvoicePaymentCondition, InvoiceType, PaymentMethod } from '@/prisma/generated/enums';
import { padStartZeros } from '@/libs/utils';

const EASYTAX_ENDPOINT = process.env.EASYTAX_ENDPOINT || '';
const EASYTAX_USERNAME = process.env.EASYTAX_USERNAME || '';
const EASYTAX_PASSWORD = process.env.EASYTAX_PASSWORD || '';
const EASYTAX_DEV_MODE = process.env.EASYTAX_DEV_MODE === 'true';

type GenerateDocumentData = {
  officeId: number;
  client: {
    name: string;
    identification: string;
    email: string;
    activityCode: string;
  };
  invoiceType: InvoiceType;
  date: Moment;
  condition: InvoicePaymentCondition;
  currency: Currency;
  method: PaymentMethod;
  ref?: string;
  total: {
    subtotal: number;
    tax: number;
    total: number;
  };
  company: {
    name: string;
    identification: string;
    activityCode: string;
  };
};

export const generateDocument = async (data: GenerateDocumentData) => {
  const params = formatGenerateDocumentParams(data);

  const response = await requestCreateDocument(params);

  return response;
};

const formatGenerateDocumentParams = (data: GenerateDocumentData) => {
  const invoiceTypeMap: Record<InvoiceType, number> = {
    [InvoiceType.ELECTRONIC]: 1,
    [InvoiceType.TICKET]: 4
  };

  const conditionMap: Record<InvoicePaymentCondition, string> = {
    [InvoicePaymentCondition.CASH]: '0',
    [InvoicePaymentCondition.CREDIT_6]: '10',
    [InvoicePaymentCondition.CREDIT_8]: '4',
    [InvoicePaymentCondition.CREDIT_16]: '5',
    [InvoicePaymentCondition.CREDIT_25]: '6',
    [InvoicePaymentCondition.CREDIT_30]: '7',
    [InvoicePaymentCondition.CREDIT_45]: '8',
    [InvoicePaymentCondition.CREDIT_60]: '11',
    [InvoicePaymentCondition.CREDIT_90]: '9'
  };

  const conditionDaysMap: Record<InvoicePaymentCondition, number> = {
    [InvoicePaymentCondition.CASH]: 0,
    [InvoicePaymentCondition.CREDIT_6]: 6,
    [InvoicePaymentCondition.CREDIT_8]: 8,
    [InvoicePaymentCondition.CREDIT_16]: 16,
    [InvoicePaymentCondition.CREDIT_25]: 25,
    [InvoicePaymentCondition.CREDIT_30]: 30,
    [InvoicePaymentCondition.CREDIT_45]: 45,
    [InvoicePaymentCondition.CREDIT_60]: 60,
    [InvoicePaymentCondition.CREDIT_90]: 90
  };

  const currencyMap: Record<Currency, number> = {
    [Currency.CRC]: 0,
    [Currency.USD]: 1
  };

  const methodMap: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: '01',
    [PaymentMethod.SINPE]: '04',
    [PaymentMethod.TRANSFER]: '04',
    [PaymentMethod.CARD]: '02'
  };

  const methodDescMap: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Efectivo',
    [PaymentMethod.SINPE]: 'Sinpe',
    [PaymentMethod.TRANSFER]: 'Efectivo',
    [PaymentMethod.CARD]: 'Tarjeta'
  };

  return {
    type: 'CREAR_DOCUMENTO',
    tipo_documento: invoiceTypeMap[data.invoiceType],
    id_company: data.company.identification, //cedula de aws
    numero_sucursal: padStartZeros(data.officeId, 3),
    // numero_consecutivo: 1, // dejar que se asigne automáticamente
    terminal: 1, // constante
    fecha_documento: data.date.format('YYYY-MM-DD'),
    fecha_vencimiento: data.date.clone().add(conditionDaysMap[data.condition], 'days').format('YYYY-MM-DD'),
    cedula_cliente: data.client.identification, // cedula de cliente
    nombre_cliente: data.client.name, // nombre de cliente
    correoCliente: data.client.email, // correo de cliente
    codigoActividadCliente: data.client.activityCode, // código actividad de cliente
    condicion_pago: conditionMap[data.condition],
    moneda: currencyMap[data.currency],
    // tipo_cambio: 1, // no enviar para que se use el del día
    total_gravado: data.total.subtotal,
    // total_exento: float (opcional en caso de enviar detalle de factura: Total de los productos / servicios exentos.)
    // total_exonerado: float (opcional en caso de enviar detalle de factura: Total de los productos / servicios exonerados.)
    // total_descuento: float (opcional en caso de enviar detalle de factura: Total de los productos / servicios exentos.)
    total_impuesto: data.total.tax, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios con impuesto.)
    // total_iva_devuelto: float (opcional en caso de enviar detalle de factura: Total de los productos / servicios con IVA devuelto.)
    // total_iva_exonerado: float (opcional en caso de enviar detalle de factura: Total de los productos / servicios exonerados.)
    // total_otros_cargos: float (opcional en caso de enviar detalle de factura: Total de los productos / servicios con otros cargos.)
    total_comprobante: data.total.total, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios del comprobante.)
    forma_pago: methodMap[data.method],
    forma_pago_desc: methodDescMap[data.method],
    forma_pago_referencia: data.ref || '',
    forma_pago_transaccion: data.ref || '',
    mensaje_hacienda: EASYTAX_DEV_MODE ? 'aceptado' : 'paraFirmar', // probar bien
    id_actividad: data.company.activityCode, // codigo actividad de aws
    idUsuario: data.company.identification, //cedula de aws
    nombreUsuario: data.company.name, // nombre de aws
    mh: EASYTAX_DEV_MODE ? 0 : 1,
    modulo: 'POS',
    corregir_consecutivo: 'si'
  };
};

const requestCreateDocument = async (data: any) => {
  const path = '/crear_documento';

  const headers = {
    Authorization: `Basic ${EASYTAX_USERNAME}`,
    Username: EASYTAX_USERNAME,
    Password: EASYTAX_PASSWORD,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.request({
      method: 'post',
      url: `${EASYTAX_ENDPOINT}${path}`,
      headers,
      data
    });

    return { valid: true, data: response.data };
  } catch (e: any) {
    console.error(e);
    const data = e.response?.data;

    return { valid: false, data };
  }
};
