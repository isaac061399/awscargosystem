import { cookies } from 'next/headers';
import moment from 'moment-timezone';

import { prismaRead } from '@libs/prisma';
import {
  CashRegisterStatus,
  Currency,
  InvoicePaymentCondition,
  InvoiceStatus,
  PaymentMethod
} from '@/prisma/generated/enums';

export const getCashRegister = async (
  id: number,
  validateIfIsClosed: boolean = false,
  validateIfIsToday: boolean = false
) => {
  try {
    const where: any = { id };

    if (validateIfIsClosed) {
      where.status = CashRegisterStatus.CLOSED;
    }

    if (validateIfIsToday) {
      const tz = (await cookies()).get('tz')?.value || 'UTC';
      const today = moment().tz(tz);

      where.open_date = { gte: today.startOf('day').toDate(), lte: today.endOf('day').toDate() };
    }

    const cashRegister = await prismaRead.cusCashRegister.findUnique({
      where,
      include: {
        administrator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            full_name: true,
            email: true
          }
        },
        office: {
          select: {
            id: true,
            name: true
          }
        },
        lines: {
          orderBy: { currency: 'desc' },
          select: {
            id: true,
            currency: true,
            cash_balance: true,
            cash_reported: true,
            cash_reported_data: true,
            cash_in: true,
            sinpe_in: true,
            transfer_in: true,
            card_in: true,
            cash_out: true,
            sinpe_out: true,
            transfer_out: true,
            card_out: true,
            cash_change: true,
            sinpe_change: true,
            transfer_change: true,
            card_change: true
          }
        }
      }
    });

    if (!cashRegister) {
      return;
    }

    return cashRegister;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getCashRegisterAdmin = async (email: string) => {
  try {
    const tz = (await cookies()).get('tz')?.value || 'UTC';
    const today = moment().tz(tz);

    const cashRegister = await prismaRead.cusCashRegister.findFirst({
      where: {
        administrator: { email },
        open_date: { gte: today.startOf('day').toDate(), lte: today.endOf('day').toDate() }
      },
      include: {
        administrator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            full_name: true,
            email: true
          }
        },
        office: {
          select: {
            id: true,
            name: true
          }
        },
        lines: {
          orderBy: { currency: 'desc' },
          select: {
            id: true,
            currency: true,
            cash_balance: true,
            cash_reported: true,
            cash_reported_data: true,
            cash_in: true,
            sinpe_in: true,
            transfer_in: true,
            card_in: true,
            cash_out: true,
            sinpe_out: true,
            transfer_out: true,
            card_out: true,
            cash_change: true,
            sinpe_change: true,
            transfer_change: true,
            card_change: true
          }
        }
      }
    });

    if (!cashRegister) {
      return;
    }

    return cashRegister;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getCashRegisterData = async (currency: Currency, cashRegister: any) => {
  try {
    const adminId = cashRegister.administrator.id;

    let cashIn = 0;
    let sinpeIn = 0;
    let transferIn = 0;
    let cardIn = 0;
    let cashOut = 0;
    let sinpeOut = 0;
    let transferOut = 0;
    let cardOut = 0;
    let cashChange = 0;

    // get invoice count
    const invoiceCount = await prismaRead.cusInvoice.count({
      where: {
        cash_register_id: cashRegister.id
      }
    });

    // get cash and not canceled invoice data
    const invoices = await prismaRead.cusInvoice.findMany({
      where: {
        cash_register_id: cashRegister.id,
        payment_condition: InvoicePaymentCondition.CASH,
        status: { not: InvoiceStatus.CANCELED }
      },
      select: {
        id: true,
        cash_change: true,
        invoice_payments: {
          select: { id: true, currency: true, payment_method: true, amount: true }
        }
      }
    });
    if (invoices && invoices.length > 0) {
      invoices.forEach((inv) => {
        inv.invoice_payments.forEach((pay) => {
          if (pay.currency === currency) {
            switch (pay.payment_method) {
              case PaymentMethod.CASH:
                cashIn += pay.amount;
                break;
              case PaymentMethod.SINPE:
                sinpeIn += pay.amount;
                break;
              case PaymentMethod.TRANSFER:
                transferIn += pay.amount;
                break;
              case PaymentMethod.CARD:
                cardIn += pay.amount;
                break;
              default:
                break;
            }
          }
        });

        if (currency === Currency.CRC && inv.cash_change && inv.cash_change > 0) {
          cashChange += inv.cash_change;
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
            cash_register_id: cashRegister.id,
            currency: currency
          }
        }
      },
      select: {
        id: true,
        cash_change: true,
        invoice_payments: {
          where: {
            cash_register_id: cashRegister.id,
            currency: currency
          },
          select: { id: true, currency: true, payment_method: true, amount: true }
        }
      }
    });
    if (paidCreditInvoices && paidCreditInvoices.length > 0) {
      paidCreditInvoices.forEach((inv) => {
        inv.invoice_payments.forEach((pay) => {
          if (pay.currency === currency) {
            switch (pay.payment_method) {
              case PaymentMethod.CASH:
                cashIn += pay.amount;
                break;
              case PaymentMethod.SINPE:
                sinpeIn += pay.amount;
                break;
              case PaymentMethod.TRANSFER:
                transferIn += pay.amount;
                break;
              case PaymentMethod.CARD:
                cardIn += pay.amount;
                break;
              default:
                break;
            }
          }
        });

        if (currency === Currency.CRC && inv.cash_change && inv.cash_change > 0) {
          cashChange += inv.cash_change;
        }
      });
    }

    // get MoneyOutflows data
    const moneyOutflows = await prismaRead.cusMoneyOutflow.findMany({
      where: {
        cash_register_id: cashRegister.id,
        administrator_id: adminId,
        currency: currency
      },
      select: { id: true, amount: true, method: true }
    });
    if (moneyOutflows && moneyOutflows.length > 0) {
      moneyOutflows.forEach((mo) => {
        switch (mo.method) {
          case PaymentMethod.CASH:
            cashOut += mo.amount;
            break;
          case PaymentMethod.SINPE:
            sinpeOut += mo.amount;
            break;
          case PaymentMethod.TRANSFER:
            transferOut += mo.amount;
            break;
          case PaymentMethod.CARD:
            cardOut += mo.amount;
            break;
          default:
            break;
        }
      });
    }

    return {
      invoice_count: invoiceCount || 0,
      cash_in: cashIn,
      sinpe_in: sinpeIn,
      transfer_in: transferIn,
      card_in: cardIn,
      cash_out: cashOut,
      sinpe_out: sinpeOut,
      transfer_out: transferOut,
      card_out: cardOut,
      cash_change: cashChange,
      sinpe_change: 0,
      transfer_change: 0,
      card_change: 0
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return {
      invoice_count: 0,
      cash_in: 0,
      sinpe_in: 0,
      transfer_in: 0,
      card_in: 0,
      cash_out: 0,
      sinpe_out: 0,
      transfer_out: 0,
      card_out: 0,
      cash_change: 0,
      sinpe_change: 0,
      transfer_change: 0,
      card_change: 0
    };
  }
};

export const getCashData = (options: { [key: string]: string }, data: { [key: string]: number }) => {
  const details = {} as { [key: string]: number };
  let total = 0;

  Object.keys(options).forEach((key) => {
    const amount = parseFloat(key);
    const cant = data[key] || 0;

    details[key] = cant;

    total += amount * cant;
  });

  return { details, total };
};

export const getOpenCashRegister = async (adminId: number) => {
  try {
    const tz = (await cookies()).get('tz')?.value || 'UTC';
    const today = moment().tz(tz);

    const cashRegister = await prismaRead.cusCashRegister.findFirst({
      where: {
        administrator_id: adminId,
        open_date: { gte: today.startOf('day').toDate(), lte: today.endOf('day').toDate() },
        status: CashRegisterStatus.OPEN
      },
      include: {
        office: true
      }
    });

    if (!cashRegister) {
      return null;
    }

    return { id: cashRegister.id, office: cashRegister.office };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return null;
  }
};
