import moment from 'moment';

import {
  Currency,
  InvoiceAdditionalChargeType,
  OrderStatus,
  PackageStatus,
  PaymentStatus
} from '@/prisma/generated/enums';
import {
  CusConfiguration,
  CusInvoice,
  CusInvoiceAdditionalCharge,
  CusInvoiceLine,
  CusOffice,
  Prisma
} from '@/prisma/generated/client';

import { prismaRead, Tx } from '@/libs/prisma';
import { additionalExchangeRate, billingDefaultActivityCode } from '@/libs/constants';

import {
  BillingCCAdditionalCharge,
  BillingCCLine,
  BillingLine,
  calculateTaxes,
  convertCRC,
  convertUSD,
  getOrderProductPrice,
  PaymentLine
} from '@/helpers/calculations';

import { CancelDocumentData, DocumentData } from '@/services/easytax';

export const getInvoice = async (id: number) => {
  try {
    const invoice = await prismaRead.cusInvoice.findUnique({
      where: { id },
      include: {
        cancelled_by: {
          select: { id: true, full_name: true, email: true }
        },
        cash_register: {
          select: {
            id: true,
            administrator: { select: { id: true, full_name: true, email: true } },
            office: { select: { id: true, name: true, billing_number: true, billing_terminal: true } }
          }
        },
        client: {
          include: {
            office: { select: { id: true, name: true, mailbox_prefix: true } },
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
            }
          }
        },
        invoice_lines: {
          include: {
            package: true,
            order_product: true,
            product: true
          }
        },
        invoice_additional_charges: true,
        invoice_payments: true
      }
    });

    if (!invoice) {
      return;
    }

    return invoice;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const validateLines = async (
  lines: any[]
): Promise<{ valid: boolean; data?: BillingLine[]; errors?: string[] }> => {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return { valid: false, data: [], errors: ['No se han proporcionado líneas de facturación'] };
  }

  const errors: string[] = [];
  const data: BillingLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.package_id) {
      const pkg = await prismaRead.cusPackage.findUnique({
        where: { id: parseInt(line.package_id), status: PackageStatus.READY, payment_status: PaymentStatus.PENDING }
      });

      if (!pkg) {
        errors.push(`Paquete inválido en la línea ${i + 1}`);
        continue;
      }

      data.push({
        id: `line-${i + 1}`,
        refObj: { type: 'package', obj: pkg },
        ref: pkg.tracking,
        description: pkg.description || '',
        quantity: 1,
        unit_price: pkg.billing_amount,
        currency: Currency.USD,
        total: pkg.billing_amount
      });
    } else if (line.order_product_id) {
      const orderProduct = await prismaRead.cusOrderProduct.findUnique({
        where: { id: parseInt(line.order_product_id), payment_status: PaymentStatus.PENDING }
      });

      if (!orderProduct) {
        errors.push(`Pedido inválido en la línea ${i + 1}`);
        continue;
      }

      const price = getOrderProductPrice(orderProduct);

      data.push({
        id: `line-${i + 1}`,
        refObj: { type: 'order_product', obj: orderProduct },
        ref: orderProduct.tracking || '',
        description: `${orderProduct.quantity} x ${orderProduct.name}`,
        quantity: 1,
        unit_price: price,
        currency: Currency.USD,
        total: price
      });
    } else if (line.product_id) {
      const product = await prismaRead.cusProduct.findUnique({
        where: { id: parseInt(line.product_id), enabled: true }
      });

      if (!product) {
        errors.push(`Producto inválido en la línea ${i + 1}`);
        continue;
      }

      const quantity = line.quantity && !isNaN(line.quantity) ? parseInt(line.quantity) : 1;

      data.push({
        id: `line-${i + 1}`,
        refObj: { type: 'product', obj: product },
        ref: product.code,
        description: product.name,
        quantity: quantity,
        unit_price: product.price,
        currency: product.currency,
        total: product.price * quantity
      });
    } else {
      errors.push(`Línea inválida en la línea ${i + 1}`);
    }
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : [],
    errors: errors.length > 0 ? errors : undefined
  };
};

export const validateLinesCC = async (
  lines: any[]
): Promise<{ valid: boolean; data?: BillingCCLine[]; errors?: string[] }> => {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return { valid: true, data: [] };
  }

  const data: BillingCCLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const quantity = line.quantity && !isNaN(line.quantity) ? parseInt(line.quantity) : 1;
    const unitPrice = line.unit_price && !isNaN(line.unit_price) ? parseFloat(line.unit_price) : 0;
    const total = parseFloat((quantity * unitPrice).toFixed(2));

    data.push({
      id: `line-${i + 1}`,
      code: line.code || '',
      cabys: line.cabys || '',
      description: line.description || '',
      quantity: quantity,
      currency: line.currency || Currency.CRC,
      unit_price: unitPrice,
      total: total,
      is_exempt: line.is_exempt || false
    });
  }

  return { valid: true, data: data };
};

export const validateAdditionalChargesCC = async (
  additionalCharges: any[]
): Promise<{ valid: boolean; data?: BillingCCAdditionalCharge[]; errors?: string[] }> => {
  if (!additionalCharges || !Array.isArray(additionalCharges) || additionalCharges.length === 0) {
    return { valid: true, data: [] };
  }

  const errors: string[] = [];
  const data: BillingCCAdditionalCharge[] = [];
  for (let i = 0; i < additionalCharges.length; i++) {
    const line = additionalCharges[i];

    if (!line.type) {
      errors.push(`Tipo de cargo adicional inválido en la línea ${i + 1}`);
      continue;
    } else if (!InvoiceAdditionalChargeType[line.type as keyof typeof InvoiceAdditionalChargeType]) {
      errors.push(`Tipo de cargo adicional inválido en la línea ${i + 1}`);
      continue;
    } else if (line.type === InvoiceAdditionalChargeType.OTHER && !line.type_description) {
      errors.push(`Descripción requerida para tipo de cargo adicional 'Otros Cargos' en la línea ${i + 1}`);
      continue;
    } else if (
      line.type === InvoiceAdditionalChargeType.THIRD_PARTY_CHARGE &&
      (!line.third_party_identification || !line.third_party_name)
    ) {
      errors.push(`Información requerida para tipo de cargo adicional 'Cobro de un Tercero' en la línea ${i + 1}`);
      continue;
    }

    data.push({
      id: `line-${i + 1}`,
      type: line.type || InvoiceAdditionalChargeType.OTHER,
      type_description: line.type_description || '',
      third_party_identification: line.third_party_identification || '',
      third_party_name: line.third_party_name || '',
      details: line.details || '',
      currency: line.currency || Currency.CRC,
      amount: line.amount && !isNaN(line.amount) ? parseFloat(line.amount) : 0
    });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : [],
    errors: errors.length > 0 ? errors : undefined
  };
};

export const validatePayments = (payments: any[]): { valid: boolean; data?: PaymentLine[]; errors?: string[] } => {
  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return { valid: false, data: [], errors: ['No se han proporcionado pagos'] };
  }

  const errors: string[] = [];
  const data: PaymentLine[] = [];
  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i];

    if (!payment.currency) {
      errors.push(`Moneda inválida en el pago ${i + 1}`);
      continue;
    }

    if (!payment.method) {
      errors.push(`Método de pago inválido en el pago ${i + 1}`);
      continue;
    }

    if (!payment.amount || isNaN(payment.amount)) {
      errors.push(`Monto de pago inválido en el pago ${i + 1}`);
      continue;
    }

    data.push({
      id: `payment-${i + 1}`,
      currency: payment.currency,
      method: payment.method,
      ref: payment.ref || '',
      ref_bank: payment.ref_bank || '',
      amount: parseFloat(payment.amount)
    });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : [],
    errors: errors.length > 0 ? errors : undefined
  };
};

export const getMostValuablePayment = (payments: PaymentLine[], buyingConversionRate: number): PaymentLine => {
  const baseCurrency = Currency.CRC;
  let mostValuable = payments[0];
  let mostValuableAmount = 0;

  payments.forEach((payment) => {
    const amount =
      payment.currency === baseCurrency ? payment.amount : convertCRC(payment.amount, buyingConversionRate);

    if (amount > mostValuableAmount) {
      mostValuable = payment;
      mostValuableAmount = amount;
    }
  });

  return mostValuable;
};

export const updateLineReferences = async (lines: BillingLine[], tx: Tx): Promise<boolean> => {
  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.refObj.type === 'package') {
        // save status
        await tx.cusPackage.update({
          where: { id: line.refObj.obj.id },
          data: {
            payment_status: PaymentStatus.PAID,
            status: PackageStatus.DELIVERED,
            status_date: new Date()
          }
        });

        // save status log
        await tx.cusPackageStatusLog.create({
          data: {
            package_id: line.refObj.obj.id,
            status: PackageStatus.DELIVERED
          }
        });
      } else if (line.refObj.type === 'order_product') {
        // save status
        await tx.cusOrderProduct.update({
          where: { id: line.refObj.obj.id },
          data: {
            payment_status: PaymentStatus.PAID,
            status: line.refObj.obj.status === OrderStatus.READY ? OrderStatus.DELIVERED : undefined,
            status_date: line.refObj.obj.status === OrderStatus.READY ? new Date() : undefined
          }
        });

        // save status log
        if (line.refObj.obj.status === OrderStatus.READY) {
          await tx.cusOrderProductStatusLog.create({
            data: {
              order_product_id: line.refObj.obj.id,
              status: OrderStatus.DELIVERED
            }
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Error: ${error}`);

    return false;
  }
};

export const rollbackLineReferences = async (
  lines: Prisma.CusInvoiceLineGetPayload<{
    include: {
      package: true;
      order_product: true;
      product: true;
    };
  }>[],
  tx: Tx
): Promise<boolean> => {
  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.package) {
        const statusChanged = line.package_prev_status && line.package.status !== line.package_prev_status;

        // save status
        await tx.cusPackage.update({
          where: { id: line.package.id },
          data: {
            payment_status: line.prev_payment_status || undefined,
            status: statusChanged ? line.package_prev_status || undefined : undefined
          }
        });

        // delete last status log
        if (statusChanged) {
          await tx.cusPackageStatusLog.deleteMany({
            where: {
              package_id: line.package.id,
              status: line.package.status
            }
          });
        }
      } else if (line.order_product) {
        const statusChanged =
          line.order_product_prev_status && line.order_product.status !== line.order_product_prev_status;

        // save status
        await tx.cusOrderProduct.update({
          where: { id: line.order_product.id },
          data: {
            payment_status: line.prev_payment_status || undefined,
            status: statusChanged ? line.order_product_prev_status || undefined : undefined
          }
        });

        // delete last status log
        if (statusChanged) {
          await tx.cusOrderProductStatusLog.deleteMany({
            where: {
              order_product_id: line.order_product.id,
              status: line.order_product.status
            }
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Error: ${error}`);

    return false;
  }
};

export const buildCreateDocumentPayload = (data: {
  configuration: CusConfiguration;
  office: CusOffice;
  invoice: CusInvoice;
  lines: CusInvoiceLine[];
  additionalCharges: CusInvoiceAdditionalCharge[];
}): DocumentData => {
  const { configuration, office, invoice, lines, additionalCharges } = data;

  let exchangeRate = 1;
  if (invoice.currency === Currency.USD) {
    exchangeRate = invoice.selling_exchange_rate - additionalExchangeRate;
  }

  return {
    company: {
      name: configuration.billing_name,
      identification: configuration.billing_identification,
      activityCode: configuration.billing_activity_code
    },
    office: {
      number: office.billing_number,
      terminal: office.billing_terminal
    },
    client: {
      name: invoice.client_name,
      identification: invoice.client_identification,
      email: invoice.client_email,
      activityCode: invoice.client_activity_code || billingDefaultActivityCode
    },
    invoiceType: invoice.type,
    date: moment(invoice.created_at),
    expirationDate: moment(invoice.expired_at),
    condition: invoice.payment_condition,
    conditionDays: invoice.payment_condition_days,
    currency: invoice.currency,
    exchangeRate: exchangeRate,
    method: invoice.payment_method,
    ref: invoice.payment_method_ref || '',
    lines: buildDocumentLines(invoice, lines),
    additionalCharges: buildDocumentAdditionalCharges(invoice, additionalCharges)
  };
};

export const buildCancelDocumentPayload = (data: {
  configuration: CusConfiguration;
  office: CusOffice;
  invoice: CusInvoice;
  lines: CusInvoiceLine[];
  additionalCharges: CusInvoiceAdditionalCharge[];
}): CancelDocumentData => {
  const { configuration, office, invoice, lines, additionalCharges } = data;

  let exchangeRate = 1;
  if (invoice.currency === Currency.USD) {
    exchangeRate = invoice.selling_exchange_rate - additionalExchangeRate;
  }

  return {
    reference: {
      invoiceType: invoice.type,
      consecutive: invoice.consecutive,
      date: moment(invoice.created_at)
    },
    company: {
      name: configuration.billing_name,
      identification: configuration.billing_identification,
      activityCode: configuration.billing_activity_code
    },
    office: {
      number: office.billing_number,
      terminal: office.billing_terminal
    },
    client: {
      name: invoice.client_name,
      identification: invoice.client_identification,
      email: invoice.client_email,
      activityCode: invoice.client_activity_code || billingDefaultActivityCode
    },
    currency: invoice.currency,
    method: invoice.payment_method,
    exchangeRate: exchangeRate,
    ref: invoice.payment_method_ref || '',
    lines: buildDocumentLines(invoice, lines),
    additionalCharges: buildDocumentAdditionalCharges(invoice, additionalCharges)
  };
};

const buildDocumentLines = (invoice: CusInvoice, lines: CusInvoiceLine[]) => {
  const invoiceCurrency = invoice.currency;

  return lines.map((line) => {
    let unitPrice = line.unit_price;
    let subtotal = line.total;

    if (line.currency !== invoiceCurrency) {
      if (invoiceCurrency === Currency.CRC) {
        unitPrice = convertCRC(line.unit_price, invoice.selling_exchange_rate);
        subtotal = convertCRC(line.total, invoice.selling_exchange_rate);
      } else if (invoiceCurrency === Currency.USD) {
        unitPrice = convertUSD(line.unit_price, invoice.buying_exchange_rate);
        subtotal = convertUSD(line.total, invoice.buying_exchange_rate);
      }
    }

    const totals = calculateTaxes(subtotal, line.iva_percentage);

    return {
      code: line.code,
      cabys: line.cabys,
      description: line.description,
      ivaPercentage: line.iva_percentage,
      quantity: line.quantity,
      unitPrice: unitPrice,
      isExempt: line.is_exempt,
      subtotal: totals.subtotal,
      tax: totals.taxes,
      total: totals.total
    };
  });
};

const buildDocumentAdditionalCharges = (invoice: CusInvoice, additionalCharges: CusInvoiceAdditionalCharge[]) => {
  return additionalCharges.map((line) => {
    const invoiceCurrency = invoice.currency;
    let amount = line.amount;

    if (line.currency !== invoiceCurrency) {
      if (invoiceCurrency === Currency.CRC) {
        amount = convertCRC(line.amount, invoice.selling_exchange_rate);
      } else if (invoiceCurrency === Currency.USD) {
        amount = convertUSD(line.amount, invoice.buying_exchange_rate);
      }
    }

    return {
      type: line.type,
      typeDescription: line.type_description || '',
      thirdPartyIdentification: line.third_party_identification || '',
      thirdPartyName: line.third_party_name || '',
      details: line.details,
      amount: amount
    };
  });
};
