import axios from 'axios';
import moment, { Moment } from 'moment';

import { Currency, InvoicePaymentCondition, InvoiceType, PaymentMethod } from '@/prisma/generated/enums';

const EASYTAX_ENDPOINT = process.env.EASYTAX_ENDPOINT || '';
const EASYTAX_USERNAME = process.env.EASYTAX_USERNAME || '';
const EASYTAX_PASSWORD = process.env.EASYTAX_PASSWORD || '';
const EASYTAX_DEV_MODE = process.env.EASYTAX_DEV_MODE === 'true';

// Constants
const tipoTransaccion = '01'; // venta normal de bienes y servicios
const codigoTarifa = '08'; // tarifa general 13%
const tipoNotaCredito = 3; // nota de crédito
const condicionNotaCredito = '01'; // contado (la nota de crédito siempre es para corregir una factura ya emitida, por lo que se asume que la condición es contado)
const codigoReferencia = '01'; // anulación de la factura original
const razonReferencia = (consecutive: string) => `Anulación de factura original ${consecutive}`; // razón de la referencia

// Create document
export type DocumentData = {
  company: {
    name: string;
    identification: string;
    activityCode: string;
  };
  office: {
    number: number;
    terminal: number;
  };
  client: {
    name: string;
    identification: string;
    email: string;
    activityCode: string;
  };
  invoiceType: InvoiceType;
  date: Moment;
  expirationDate: Moment;
  condition: InvoicePaymentCondition;
  conditionDays: number;
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
  console.log('documentPayload', JSON.stringify(data));

  const params = formatDocumentParams(data);

  console.log('easytaxPayload', JSON.stringify(params));

  const response = await requestCreateDocument(params);

  console.log('easytaxResponse', JSON.stringify(response));

  return response;
};

const formatDocumentParams = (data: DocumentData) => {
  return {
    type: 'CREAR_DOCUMENTO',
    tipo_documento: invoiceTypeMap[data.invoiceType],
    id_company: data.company.identification, // cedula de aws
    numero_sucursal: data.office.number,
    // numero_consecutivo: 0, // no enviar para que easytax asigne el siguiente consecutivo
    terminal: data.office.terminal, // se refiere al número de caja, el 1 está reservado para POS
    fecha_documento: data.date.format('YYYY-MM-DD HH:mm:ss'),
    fecha_vencimiento: data.expirationDate.format('YYYY-MM-DD HH:mm:ss'),
    cedula_cliente: data.client.identification, // cedula de cliente
    nombre_cliente: data.client.name, // nombre de cliente
    correoCliente: data.client.email, // correo de cliente
    codigoActividadCliente: data.client.activityCode, // código actividad de cliente
    condicion_pago: conditionMap[data.condition],
    plazoCredito: data.conditionDays,
    moneda: currencyMap[data.currency],
    // tipo_cambio: 1, // no enviar para que se use el del día
    forma_pago: methodMap[data.method],
    forma_pago_desc: methodDescMap[data.method],
    forma_pago_referencia: data.ref || '',
    forma_pago_transaccion: data.ref || '',
    mensaje_hacienda: EASYTAX_DEV_MODE ? 'aceptado' : 'paraFirmar', // probar bien
    id_actividad: data.company.activityCode, // codigo actividad de aws
    idUsuario: data.company.identification, //cedula de aws
    nombreUsuario: data.company.name, // nombre de aws
    mh: 1,
    latitud: '0',
    longitud: '0',
    modulo: 'POS',
    corregir_consecutivo: 'SI', // constante para siempre corregir el consecutivo en caso de errores
    crearCliente: 'SI',
    crearProducto: 'SI',
    // detalle
    detalle_factura: data.lines.map((line, index) => ({
      numero_linea: index + 1,
      codigo_producto: line.cabys,
      descripcion_producto: line.description,
      tipo_transaccion: tipoTransaccion,
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
      codigo_tarifa: codigoTarifa,
      monto_exportacion: 0,
      observaciones: ''
    }))
  };
};

// Cancel document

export type CancelDocumentData = {
  reference: {
    invoiceType: InvoiceType;
    consecutive: string;
    date: Moment;
  };
  company: {
    name: string;
    identification: string;
    activityCode: string;
  };
  office: {
    number: number;
    terminal: number;
  };
  client: {
    name: string;
    identification: string;
    email: string;
    activityCode: string;
  };
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

export const generateCancelDocument = async (data: CancelDocumentData) => {
  console.log('documentPayload', JSON.stringify(data));

  const params = formatCancelDocumentParams(data);

  console.log('easytaxPayload', JSON.stringify(params));

  const response = await requestCreateDocument(params);

  console.log('easytaxResponse', JSON.stringify(response));

  return response;
};

const formatCancelDocumentParams = (data: CancelDocumentData) => {
  return {
    type: 'CREAR_DOCUMENTO',
    tipo_documento: tipoNotaCredito,
    id_company: data.company.identification, // cedula de aws
    numero_sucursal: data.office.number,
    // numero_consecutivo: 0, // no enviar para que easytax asigne el siguiente consecutivo
    terminal: data.office.terminal, // se refiere al número de caja, el 1 está reservado para POS
    fecha_documento: moment().format('YYYY-MM-DD HH:mm:ss'),
    fecha_vencimiento: moment().format('YYYY-MM-DD HH:mm:ss'),
    cedula_cliente: data.client.identification, // cedula de cliente
    nombre_cliente: data.client.name, // nombre de cliente
    correoCliente: data.client.email, // correo de cliente
    codigoActividadCliente: data.client.activityCode, // código actividad de cliente
    condicion_pago: condicionNotaCredito,
    plazoCredito: 0,
    moneda: currencyMap[data.currency],
    // tipo_cambio: 1, // no enviar para que se use el del día
    forma_pago: methodMap[data.method],
    forma_pago_desc: methodDescMap[data.method],
    forma_pago_referencia: data.ref || '',
    forma_pago_transaccion: data.ref || '',
    mensaje_hacienda: EASYTAX_DEV_MODE ? 'aceptado' : 'paraFirmar', // probar bien
    id_actividad: data.company.activityCode, // codigo actividad de aws
    idUsuario: data.company.identification, //cedula de aws
    nombreUsuario: data.company.name, // nombre de aws
    mh: 1,
    latitud: '0',
    longitud: '0',
    modulo: 'POS',
    corregir_consecutivo: 'SI', // constante para siempre corregir el consecutivo en caso de errores
    crearCliente: 'SI',
    crearProducto: 'SI',
    // referencia
    referencia_tipo_documento: invoiceTypeMap[data.reference.invoiceType],
    referencia_numero: data.reference.consecutive,
    referencia_fecha_emision: data.reference.date.format('YYYY-MM-DD HH:mm:ss'),
    referencia_codigo_referencia: codigoReferencia,
    referencia_razon: razonReferencia(data.reference.consecutive),
    //detalle
    detalle_factura: data.lines.map((line, index) => ({
      numero_linea: index + 1,
      codigo_producto: line.cabys,
      descripcion_producto: line.description,
      tipo_transaccion: tipoTransaccion,
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
      codigo_tarifa: codigoTarifa,
      monto_exportacion: 0,
      observaciones: ''
    }))
  };
};

// Utils

const requestCreateDocument = async (data: any) => {
  // const path = '/facturacion';
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

const invoiceTypeMap: Record<InvoiceType, number> = {
  [InvoiceType.ELECTRONIC]: 1,
  [InvoiceType.TICKET]: 4
};

const conditionMap: Record<InvoicePaymentCondition, string> = {
  [InvoicePaymentCondition.CASH]: '01',
  [InvoicePaymentCondition.CREDIT]: '02'
};

const currencyMap: Record<Currency, number> = {
  [Currency.CRC]: 0,
  [Currency.USD]: 1
};

const methodMap: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: '01',
  [PaymentMethod.SINPE]: '06',
  [PaymentMethod.TRANSFER]: '04',
  [PaymentMethod.CARD]: '02'
};

const methodDescMap: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.SINPE]: 'Sinpe',
  [PaymentMethod.TRANSFER]: 'Efectivo',
  [PaymentMethod.CARD]: 'Tarjeta'
};
