import axios from 'axios';
import { Moment } from 'moment';

import { Currency, InvoicePaymentCondition, InvoiceType, PaymentMethod } from '@/prisma/generated/enums';
import { paymentConditionsDays } from '@/libs/constants';
import { padStartZeros } from '@/libs/utils';

const EASYTAX_ENDPOINT = process.env.EASYTAX_ENDPOINT || '';
const EASYTAX_USERNAME = process.env.EASYTAX_USERNAME || '';
const EASYTAX_PASSWORD = process.env.EASYTAX_PASSWORD || '';
const EASYTAX_DEV_MODE = process.env.EASYTAX_DEV_MODE === 'true';

export type DocumentData = {
  company: {
    name: string;
    identification: string;
    activityCode: string;
  };
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
  ivaPercentage: number;
  lines: Array<{
    cabys: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    tax: number;
    total: number;
  }>;
};

export const generateDocument = async (data: DocumentData) => {
  console.log('documentPayload', data);

  const params = formatGenerateDocumentParams(data);

  console.log('easytaxPayload', params);

  const response = await requestCreateDocument(params);

  console.log('easytaxResponse', response);

  return response;
};

const formatGenerateDocumentParams = (data: DocumentData) => {
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
    fecha_vencimiento: data.date.clone().add(paymentConditionsDays[data.condition], 'days').format('YYYY-MM-DD'),
    cedula_cliente: data.client.identification, // cedula de cliente
    nombre_cliente: data.client.name, // nombre de cliente
    correoCliente: data.client.email, // correo de cliente
    codigoActividadCliente: data.client.activityCode, // código actividad de cliente
    condicion_pago: conditionMap[data.condition],
    moneda: currencyMap[data.currency],
    // tipo_cambio: 1, // no enviar para que se use el del día
    // total_gravado: data.total.subtotal,
    // total_exento: 0, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios exentos.)
    // total_exonerado: 0, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios exonerados.)
    // total_descuento: 0, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios exentos.)
    // total_impuesto: data.total.tax, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios con impuesto.)
    // total_iva_devuelto: 0, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios con IVA devuelto.)
    // total_iva_exonerado: 0, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios exonerados.)
    // total_otros_cargos: 0, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios con otros cargos.)
    // total_comprobante: data.total.total, // float (opcional en caso de enviar detalle de factura: Total de los productos / servicios del comprobante.)
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
    corregir_consecutivo: 'si',
    detalle_factura: data.lines.map((line, index) => ({
      numero_linea: index + 1,
      codigo_producto: line.cabys,
      descripcion_producto: line.description,
      cantidad: line.quantity,
      precio_unitario: line.unitPrice,
      subtotal: line.subtotal,
      IVA: data.ivaPercentage,
      total_descuento: 0,
      total_gravado: line.subtotal,
      total_exento: 0,
      total_exonerado: 0,
      total_impuesto: line.tax,
      total_impuesto_exonerado: 0,
      total_comprobante: line.total,
      codigo_impuesto: '01',
      codigo_tarifa: '08',
      observaciones: ''
    }))
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

    return { valid: true, status: response.status, statusText: response.statusText, data: response.data };
  } catch (e: any) {
    console.error(e);
    const data = e.response?.data;

    return { valid: false, data };
  }
};
