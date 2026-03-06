import { cookies } from 'next/headers';
import moment from 'moment-timezone';

import { prismaRead } from '@libs/prisma';
import {
  Currency,
  InvoicePaymentCondition,
  InvoiceStatus,
  PackageStatus,
  PaymentMethod
} from '@/prisma/generated/enums';
import { padStartZeros } from '@/libs/utils';
import { convertPoundToKg } from '@/helpers/calculations';

import { clientSelectSchema } from './Client.Controller';

type Filters = {
  officeId?: number;
  startDate?: string;
  endDate?: string;
  cutNumber?: string;
};

export const getPackagesReady = async (textT: any, filters: Filters) => {
  const tz = (await cookies()).get('tz')?.value || 'UTC';

  const result = {
    documentName: textT.documentName,
    headers: Object.values(textT.headers) as string[],
    data: [] as any[]
  };

  try {
    const where: any = { status: PackageStatus.READY };

    if (filters.officeId) {
      where.client = { office_id: filters.officeId };
    }

    if (filters.startDate) {
      where.status_date = { gte: moment(filters.startDate).startOf('day').toISOString() };
    }

    if (filters.endDate) {
      where.status_date = { ...where.status_date, lte: moment(filters.endDate).endOf('day').toISOString() };
    }

    const packages = await prismaRead.cusPackage.findMany({
      where,
      orderBy: [{ status_date: 'asc' }],
      select: {
        id: true,
        tracking: true,
        location_row: true,
        location_shelf: true,
        status_date: true,
        client: {
          select: clientSelectSchema
        }
      }
    });

    result.data = packages?.map((p) => {
      return {
        [textT?.headers.id]: p.id,
        [textT?.headers.client_office]: p.client?.office?.name,
        [textT?.headers.client_mailbox]: `${p.client?.office?.mailbox_prefix}${p.client?.id}`,
        [textT?.headers.client_full_name]: p.client?.full_name,
        [textT?.headers.client_identification]: p.client?.identification,
        [textT?.headers.client_email]: p.client?.email,
        [textT?.headers.tracking]: p.tracking,
        [textT?.headers.location_shelf]: p.location_shelf,
        [textT?.headers.location_row]: p.location_row,
        [textT?.headers.status_date]: moment(p.status_date).tz(tz).format('YYYY-MM-DD HH:mm:ss'),
        [textT?.headers.status_date_days]: moment().tz(tz).diff(moment(p.status_date).tz(tz), 'days')
      };
    });

    return result;
  } catch (error) {
    console.error(`Report Error: ${error}`);

    return result;
  }
};

export const getOrdersReady = async (textT: any, filters: Filters) => {
  const tz = (await cookies()).get('tz')?.value || 'UTC';

  const result = {
    documentName: textT.documentName,
    headers: Object.values(textT.headers) as string[],
    data: [] as any[]
  };

  try {
    const where: any = { status: PackageStatus.READY };

    if (filters.officeId) {
      where.order = { client: { office_id: filters.officeId } };
    }

    if (filters.startDate) {
      where.status_date = { gte: moment(filters.startDate).startOf('day').toISOString() };
    }

    if (filters.endDate) {
      where.status_date = { ...where.status_date, lte: moment(filters.endDate).endOf('day').toISOString() };
    }

    const orderProducts = await prismaRead.cusOrderProduct.findMany({
      where,
      orderBy: [{ status_date: 'asc' }, { order_id: 'asc' }],
      select: {
        id: true,
        tracking: true,
        name: true,
        location_row: true,
        location_shelf: true,
        status_date: true,
        order: {
          select: {
            id: true,
            number: true,
            client: {
              select: clientSelectSchema
            }
          }
        }
      }
    });

    result.data = orderProducts?.map((op) => {
      return {
        [textT?.headers.id]: op.id,
        [textT?.headers.client_office]: op.order.client?.office?.name,
        [textT?.headers.client_mailbox]: `${op.order.client?.office?.mailbox_prefix}${op.order.client?.id}`,
        [textT?.headers.client_full_name]: op.order.client?.full_name,
        [textT?.headers.client_identification]: op.order.client?.identification,
        [textT?.headers.client_email]: op.order.client?.email,
        [textT?.headers.tracking]: op.tracking,
        [textT?.headers.order_id]: padStartZeros(op.order.id, 4),
        [textT?.headers.order_number]: op.order.number,
        [textT?.headers.product]: op.name,
        [textT?.headers.location_shelf]: op.location_shelf,
        [textT?.headers.location_row]: op.location_row,
        [textT?.headers.status_date]: moment(op.status_date).tz(tz).format('YYYY-MM-DD HH:mm:ss'),
        [textT?.headers.status_date_days]: moment().tz(tz).diff(moment(op.status_date).tz(tz), 'days')
      };
    });

    return result;
  } catch (error) {
    console.error(`Report Error: ${error}`);

    return result;
  }
};

export const getCashRegisterMovement = async (textT: any, filters: Filters) => {
  const result = {
    documentName: textT.documentName,
    headers: Object.values(textT.headers) as string[],
    data: [] as any[]
  };

  try {
    const rowsData = await getAmounts(filters);
    let totalCRC = 0;
    let totalUSD = 0;

    // cashIn
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.cashIn,
      [textT?.headers.crc]: rowsData.cashIn[Currency.CRC],
      [textT?.headers.usd]: rowsData.cashIn[Currency.USD]
    });
    totalCRC += rowsData.cashIn[Currency.CRC];
    totalUSD += rowsData.cashIn[Currency.USD];

    // sinpeIn
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.sinpeIn,
      [textT?.headers.crc]: rowsData.sinpeIn[Currency.CRC],
      [textT?.headers.usd]: rowsData.sinpeIn[Currency.USD]
    });
    totalCRC += rowsData.sinpeIn[Currency.CRC];
    totalUSD += rowsData.sinpeIn[Currency.USD];

    // transferIn
    Object.keys(rowsData.transferIn).forEach((bank) => {
      result.data.push({
        [textT?.headers.method]: `${textT?.amounts?.transferIn} - ${bank}`,
        [textT?.headers.crc]: rowsData.transferIn[bank][Currency.CRC] || 0,
        [textT?.headers.usd]: rowsData.transferIn[bank][Currency.USD] || 0
      });
      totalCRC += rowsData.transferIn[bank][Currency.CRC] || 0;
      totalUSD += rowsData.transferIn[bank][Currency.USD] || 0;
    });

    // cardIn
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.cardIn,
      [textT?.headers.crc]: rowsData.cardIn[Currency.CRC],
      [textT?.headers.usd]: rowsData.cardIn[Currency.USD]
    });
    totalCRC += rowsData.cardIn[Currency.CRC];
    totalUSD += rowsData.cardIn[Currency.USD];

    // cashOut
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.cashOut,
      [textT?.headers.crc]: rowsData.cashOut[Currency.CRC] * -1,
      [textT?.headers.usd]: rowsData.cashOut[Currency.USD] * -1
    });
    totalCRC -= rowsData.cashOut[Currency.CRC];
    totalUSD -= rowsData.cashOut[Currency.USD];

    // sinpeOut
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.sinpeOut,
      [textT?.headers.crc]: rowsData.sinpeOut[Currency.CRC] * -1,
      [textT?.headers.usd]: rowsData.sinpeOut[Currency.USD] * -1
    });
    totalCRC -= rowsData.sinpeOut[Currency.CRC];
    totalUSD -= rowsData.sinpeOut[Currency.USD];

    // transferOut
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.transferOut,
      [textT?.headers.crc]: rowsData.transferOut[Currency.CRC] * -1,
      [textT?.headers.usd]: rowsData.transferOut[Currency.USD] * -1
    });
    totalCRC -= rowsData.transferOut[Currency.CRC];
    totalUSD -= rowsData.transferOut[Currency.USD];

    // cardOut
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.cardOut,
      [textT?.headers.crc]: rowsData.cardOut[Currency.CRC] * -1,
      [textT?.headers.usd]: rowsData.cardOut[Currency.USD] * -1
    });
    totalCRC -= rowsData.cardOut[Currency.CRC];
    totalUSD -= rowsData.cardOut[Currency.USD];

    // cashChange
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.cashChange,
      [textT?.headers.crc]: rowsData.cashChange[Currency.CRC] * -1,
      [textT?.headers.usd]: rowsData.cashChange[Currency.USD] * -1
    });
    totalCRC -= rowsData.cashChange[Currency.CRC];
    totalUSD -= rowsData.cashChange[Currency.USD];

    // total
    result.data.push({
      [textT?.headers.method]: textT?.amounts?.total,
      [textT?.headers.crc]: totalCRC,
      [textT?.headers.usd]: totalUSD
    });

    return result;
  } catch (error) {
    console.error(`Report Error: ${error}`);

    return result;
  }
};

const getAmounts = async (filters: Filters) => {
  const data = {
    cashIn: { [Currency.CRC]: 0, [Currency.USD]: 0 },
    sinpeIn: { [Currency.CRC]: 0, [Currency.USD]: 0 },
    transferIn: {} as { [key: string]: { [Currency.CRC]: number; [Currency.USD]: number } },
    cardIn: { [Currency.CRC]: 0, [Currency.USD]: 0 },
    cashOut: { [Currency.CRC]: 0, [Currency.USD]: 0 },
    sinpeOut: { [Currency.CRC]: 0, [Currency.USD]: 0 },
    transferOut: { [Currency.CRC]: 0, [Currency.USD]: 0 },
    cardOut: { [Currency.CRC]: 0, [Currency.USD]: 0 },
    cashChange: { [Currency.CRC]: 0, [Currency.USD]: 0 }
  };

  try {
    const { officeId, startDate, endDate } = filters;

    // get cash and not canceled invoice data
    const invoices = await prismaRead.cusInvoice.findMany({
      where: {
        payment_condition: InvoicePaymentCondition.CASH,
        status: { not: InvoiceStatus.CANCELED },
        cash_register: officeId ? { office_id: officeId } : undefined,
        created_at: {
          gte: startDate ? moment(startDate).startOf('day').toISOString() : undefined,
          lte: endDate ? moment(endDate).endOf('day').toISOString() : undefined
        }
      },
      select: {
        id: true,
        cash_change: true,
        invoice_payments: {
          select: { id: true, currency: true, payment_method: true, ref_bank: true, amount: true }
        }
      }
    });
    if (invoices && invoices.length > 0) {
      invoices.forEach((inv) => {
        inv.invoice_payments.forEach((pay) => {
          switch (pay.payment_method) {
            case PaymentMethod.CASH:
              data.cashIn[pay.currency] += pay.amount;
              break;
            case PaymentMethod.SINPE:
              data.sinpeIn[pay.currency] += pay.amount;
              break;
            case PaymentMethod.TRANSFER:
              if (data.transferIn[pay.ref_bank][pay.currency]) {
                data.transferIn[pay.ref_bank][pay.currency] += pay.amount;
              } else {
                data.transferIn[pay.ref_bank][pay.currency] = pay.amount;
              }
              break;
            case PaymentMethod.CARD:
              data.cardIn[pay.currency] += pay.amount;
              break;
            default:
              break;
          }
        });

        if (inv.cash_change && inv.cash_change > 0) {
          data.cashChange[Currency.CRC] += inv.cash_change;
        }
      });
    }

    // get paid credits (pending) invoices
    const paidCreditInvoices = await prismaRead.cusInvoice.findMany({
      where: {
        payment_condition: { not: InvoicePaymentCondition.CASH },
        status: { not: InvoiceStatus.CANCELED },
        invoice_payments: {
          some: {
            cash_register: officeId ? { office_id: officeId } : undefined,
            created_at: {
              gte: startDate ? moment(startDate).startOf('day').toISOString() : undefined,
              lte: endDate ? moment(endDate).endOf('day').toISOString() : undefined
            }
          }
        }
      },
      select: {
        id: true,
        cash_change: true,
        invoice_payments: {
          where: {
            cash_register: officeId ? { office_id: officeId } : undefined,
            created_at: {
              gte: startDate ? moment(startDate).startOf('day').toISOString() : undefined,
              lte: endDate ? moment(endDate).endOf('day').toISOString() : undefined
            }
          },
          select: { id: true, currency: true, payment_method: true, ref_bank: true, amount: true }
        }
      }
    });
    if (paidCreditInvoices && paidCreditInvoices.length > 0) {
      paidCreditInvoices.forEach((inv) => {
        inv.invoice_payments.forEach((pay) => {
          switch (pay.payment_method) {
            case PaymentMethod.CASH:
              data.cashIn[pay.currency] += pay.amount;
              break;
            case PaymentMethod.SINPE:
              data.sinpeIn[pay.currency] += pay.amount;
              break;
            case PaymentMethod.TRANSFER:
              if (data.transferIn[pay.ref_bank][pay.currency]) {
                data.transferIn[pay.ref_bank][pay.currency] += pay.amount;
              } else {
                data.transferIn[pay.ref_bank][pay.currency] = pay.amount;
              }
              break;
              break;
            case PaymentMethod.CARD:
              data.cardIn[pay.currency] += pay.amount;
              break;
            default:
              break;
          }
        });

        if (inv.cash_change && inv.cash_change > 0) {
          data.cashChange[Currency.CRC] += inv.cash_change;
        }
      });
    }

    // get MoneyOutflows data
    const moneyOutflows = await prismaRead.cusMoneyOutflow.findMany({
      where: {
        cash_register: officeId ? { office_id: officeId } : undefined,
        created_at: {
          gte: startDate ? moment(startDate).startOf('day').toISOString() : undefined,
          lte: endDate ? moment(endDate).endOf('day').toISOString() : undefined
        }
      },
      select: { id: true, currency: true, amount: true, method: true }
    });
    if (moneyOutflows && moneyOutflows.length > 0) {
      moneyOutflows.forEach((mo) => {
        switch (mo.method) {
          case PaymentMethod.CASH:
            data.cashOut[mo.currency] += mo.amount;
            break;
          case PaymentMethod.SINPE:
            data.sinpeOut[mo.currency] += mo.amount;
            break;
          case PaymentMethod.TRANSFER:
            data.transferOut[mo.currency] += mo.amount;
            break;
          case PaymentMethod.CARD:
            data.cardOut[mo.currency] += mo.amount;
            break;
          default:
            break;
        }
      });
    }

    return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return data;
  }
};

export const getCuts = async (textT: any) => {
  const result = {
    documentName: textT.documentName,
    headers: Object.values(textT.headers) as string[],
    data: [] as any[]
  };

  try {
    const cuts = await prismaRead.cusCutLog.groupBy({
      orderBy: [{ number: 'desc' }],
      by: ['number'],
      _sum: { weight: true },
      _count: { id: true }
    });

    result.data = cuts?.map((cut) => {
      return {
        [textT?.headers.cut]: cut.number,
        [textT?.headers.packagesCount]: cut._count.id || 0,
        [textT?.headers.pounds]: cut._sum.weight || 0,
        [textT?.headers.kilos]: convertPoundToKg(cut._sum.weight || 0)
      };
    });

    return result;
  } catch (error) {
    console.error(`Report Error: ${error}`);

    return result;
  }
};

export const getPackagesInfoInCut = async (textT: any, filters: Filters) => {
  const result = {
    documentName: textT.documentName,
    headers: Object.values(textT.headers) as string[],
    data: [] as any[]
  };

  try {
    const where: any = {};

    if (filters.officeId) {
      where.order = { client: { office_id: filters.officeId } };
    }

    if (filters.cutNumber) {
      where.status_date = { gte: moment(filters.startDate).startOf('day').toISOString() };
    }

    const cutLogs = await prismaRead.cusCutLog.findMany({
      where: {
        OR: [
          { package: { client: { office_id: filters.officeId } } },
          { order: { client: { office_id: filters.officeId } } }
        ],
        number: filters.cutNumber
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        number: true,
        tracking: true,
        weight: true,
        package: { select: { client: { select: clientSelectSchema } } },
        order: { select: { client: { select: clientSelectSchema } } }
      }
    });

    result.data = cutLogs?.map((cl, index) => {
      return {
        [textT?.headers.number]: index + 1,
        [textT?.headers.cut]: cl.number,
        [textT?.headers.office]: cl.package?.client?.office?.name || cl.order?.client?.office?.name,
        [textT?.headers.tracking]: cl.tracking,
        [textT?.headers.pounds]: cl.weight,
        [textT?.headers.kilos]: convertPoundToKg(cl.weight)
      };
    });

    return result;
  } catch (error) {
    console.error(`Report Error: ${error}`);

    return result;
  }
};
