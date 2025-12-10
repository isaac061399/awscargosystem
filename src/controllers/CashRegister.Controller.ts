import { cookies } from 'next/headers';
import { type Moment } from 'moment';
import moment from 'moment-timezone';

import type {
  CashRegisterStatus,
  CusPaymentMethod,
  paymentMethod,
  WalletTransactionType
} from '@/prisma/generated/client';
import { prismaRead } from '@libs/prisma';

import { formatMoney } from '@/libs/utils';

export const getCashRegister = async (
  id: number,
  validateIfIsClosed: boolean = false,
  validateIfIsToday: boolean = false
) => {
  try {
    const where: any = { id };

    if (validateIfIsClosed) {
      where.status = 'CLOSED' as CashRegisterStatus;
    }

    if (validateIfIsToday) {
      const tz = (await cookies()).get('tz')?.value || 'UTC';
      const today = moment().tz(tz);

      where.open_date = { gte: today.startOf('day').toDate(), lte: today.endOf('day').toDate() };
    }

    const cashRegister = await prismaRead.cusCashRegister.findUnique({
      where,
      select: {
        id: true,
        open_date: true,
        close_date: true,
        cash_balance: true,
        cash_reported: true,
        cash_reported_data: true,
        cash_amount: true,
        sinpe_amount: true,
        transfer_amount: true,
        card_amount: true,
        cash_outflows: true,
        sinpe_outflows: true,
        transfer_outflows: true,
        card_outflows: true,
        comment: true,
        status: true,
        administrator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            full_name: true,
            email: true
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
      select: {
        id: true,
        open_date: true,
        close_date: true,
        cash_balance: true,
        cash_reported: true,
        cash_reported_data: true,
        cash_amount: true,
        sinpe_amount: true,
        transfer_amount: true,
        card_amount: true,
        cash_outflows: true,
        sinpe_outflows: true,
        transfer_outflows: true,
        card_outflows: true,
        comment: true,
        status: true,
        administrator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            full_name: true,
            email: true
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

export const getCashRegisterData = async (cashRegister: any, closeDate: Moment) => {
  try {
    const adminId = cashRegister.administrator.id;
    const openDate = moment(cashRegister.open_date);

    let cashAmount = 0;
    let sinpeAmount = 0;
    let transferAmount = 0;
    let cardAmount = 0;
    let cashOutflows = 0;
    let sinpeOutflows = 0;
    let transferOutflows = 0;
    let cardOutflows = 0;

    // get Payments data
    const payments = await prismaRead.cusPayment.findMany({
      where: {
        administrator_id: adminId,
        date: { gte: openDate.toDate(), lte: closeDate.toDate() }
      },
      select: { id: true, amount: true, method: true }
    });

    if (payments && payments.length > 0) {
      payments.forEach((p) => {
        switch (p.method) {
          case 'CASH' as CusPaymentMethod:
            cashAmount += p.amount;
            break;
          case 'SINPE' as CusPaymentMethod:
            sinpeAmount += p.amount;
            break;
          case 'TRANSFER' as CusPaymentMethod:
            transferAmount += p.amount;
            break;
          case 'CARD' as CusPaymentMethod:
            cardAmount += p.amount;
            break;
          default:
            break;
        }
      });
    }

    // get Wallet data
    const walletTransactions = await prismaRead.cusWalletTransaction.findMany({
      where: {
        administrator_id: adminId,
        date: { gte: openDate.toDate(), lte: closeDate.toDate() }
      },
      select: { id: true, amount: true, type: true, method: true }
    });

    if (walletTransactions && walletTransactions.length > 0) {
      walletTransactions.forEach((wt) => {
        if (wt.type === ('OUTGOING' as WalletTransactionType)) return;

        switch (wt.method) {
          case 'CASH' as paymentMethod:
            cashAmount += wt.amount;
            break;
          case 'SINPE' as paymentMethod:
            sinpeAmount += wt.amount;
            break;
          case 'TRANSFER' as paymentMethod:
            transferAmount += wt.amount;
            break;
          case 'CARD' as paymentMethod:
            cardAmount += wt.amount;
            break;
          default:
            break;
        }
      });
    }

    // get MoneyOutflows data
    const moneyOutflows = await prismaRead.cusMoneyOutflow.findMany({
      where: {
        administrator_id: adminId,
        date: { gte: openDate.toDate(), lte: closeDate.toDate() }
      },
      select: { id: true, amount: true, method: true }
    });

    if (moneyOutflows && moneyOutflows.length > 0) {
      moneyOutflows.forEach((mo) => {
        switch (mo.method) {
          case 'CASH' as paymentMethod:
            cashOutflows += mo.amount;
            break;
          case 'SINPE' as paymentMethod:
            sinpeOutflows += mo.amount;
            break;
          case 'TRANSFER' as paymentMethod:
            transferOutflows += mo.amount;
            break;
          case 'CARD' as paymentMethod:
            cardOutflows += mo.amount;
            break;
          default:
            break;
        }
      });
    }

    return {
      cash_amount: cashAmount,
      sinpe_amount: sinpeAmount,
      transfer_amount: transferAmount,
      card_amount: cardAmount,
      cash_outflows: cashOutflows,
      sinpe_outflows: sinpeOutflows,
      transfer_outflows: transferOutflows,
      card_outflows: cardOutflows
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return {
      cash_amount: 0,
      sinpe_amount: 0,
      transfer_amount: 0,
      card_amount: 0,
      cash_outflows: 0,
      sinpe_outflows: 0,
      transfer_outflows: 0,
      card_outflows: 0
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

export const getCashRegisterTicketHtml = async (entry: any) => {
  const tz = (await cookies()).get('tz')?.value || 'UTC';

  const totalEntries = entry.cash_amount + entry.sinpe_amount + entry.transfer_amount + entry.card_amount;
  const totalOutflows = entry.cash_outflows + entry.sinpe_outflows + entry.transfer_outflows + entry.card_outflows;

  const totalCashReported = entry.cash_reported - entry.cash_balance;
  const totalCash = entry.cash_amount - entry.cash_outflows;
  const totalDifference = totalCashReported - totalCash;

  const ticketWidthMm = 62;

  return `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Registro de Caja #${entry.id}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet" />
          <style>
            @page {
              size: ${ticketWidthMm}mm auto;
              margin: 7mm;
            }
            html, body {
              padding: 0;
              margin: 0;
            }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body {
              font-family: 'Noto Sans', sans-serif;
              font-size: 10pt;
              color: #111;
            }
            .ticket-container {
              box-sizing: border-box;
              width: ${ticketWidthMm}mm;
              margin: 0;
            }
            .divider {
              border: none;
              border-top: 1px solid #000;
              margin: 15px 0;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
            }
            .header img {
              max-width: 100px;
              margin: 0 auto;
            }
            .header h1 {
              margin: 5px 0;
              font-size: 18pt;
            }
            .header p {
              margin: 10px 0;
            }
            .details {
              margin-top: 15px;
            }
            .details p {
              margin: 3px 0;
            }
            .label {
              font-weight: bold;
            }
            .signature {
              text-align: center;
              margin-top: 100px;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 200px;
              margin-top: 40px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="header">
              <img src="${process.env.NEXTAUTH_URL}${process.env.SITE_LOGO}" width="100" height="100" alt="Logo" />
              <h1>${process.env.BUSINESS_NAME}</h1>
              <p>Correo: ${process.env.BUSINESS_EMAIL}</p>
              <p>Registro de Caja #${entry.id}</p>
            </div>

            <div class="details">
              <p><span class="label">Administrador:</span> ${entry.administrator.full_name}</p>
              <p><span class="label">Correo:</span> ${entry.administrator.email}</p>
              <hr class="divider" />
              <p><span class="label">Apertura:</span> ${moment(entry.open_date).tz(tz).format('DD/MM/YYYY hh:mm A')}</p>
              <p><span class="label">Cierre:</span> ${moment(entry.close_date).tz(tz).format('DD/MM/YYYY hh:mm A')}</p>
              <hr class="divider" />
              <p><span class="label">Balance inicial:</span> ${formatMoney(entry.cash_balance)}</p>
              <p><span class="label">Efectivo reportado:</span> ${formatMoney(entry.cash_reported)}</p>
              <hr class="divider" />
              <p><span class="label">Entradas en efectivo:</span> ${formatMoney(entry.cash_amount)}</p>
              <p><span class="label">Entradas en SINPE:</span> ${formatMoney(entry.sinpe_amount)}</p>
              <p><span class="label">Entradas en transferencia:</span> ${formatMoney(entry.transfer_amount)}</p>
              <p><span class="label">Total de entradas:</span> ${formatMoney(totalEntries)}</p>
              <hr class="divider" />
              <p><span class="label">Salidas en efectivo:</span> ${formatMoney(entry.cash_outflows)}</p>
              <p><span class="label">Salidas en SINPE:</span> ${formatMoney(entry.sinpe_outflows)}</p>
              <p><span class="label">Salidas en transferencia:</span> ${formatMoney(entry.transfer_outflows)}</p>
              <p><span class="label">Total de salidas:</span> ${formatMoney(totalOutflows)}</p>
              <hr class="divider" />
              <p><span class="label">Efectivo</span></p>
              <p><span class="label">Total reportado:</span> ${formatMoney(totalCashReported)}</p>
              <p><span class="label">Total en sistema:</span> ${formatMoney(totalCash)}</p>
              <p><span class="label">Diferencia:</span> ${formatMoney(totalDifference)}</p>
              <hr class="divider" />
              <p><span class="label">Comentario:</span> ${entry.comment}</p>
            </div>

            <div class="signature">
              <p><span class="label">Firma:</span> ___________________________</p>
            </div>
          </div>
        </body>
      </html>`;
};

export const isAdminCashRegisterOpen = async (adminId: number) => {
  try {
    const tz = (await cookies()).get('tz')?.value || 'UTC';
    const today = moment().tz(tz);

    const cashRegister = await prismaRead.cusCashRegister.findFirst({
      where: {
        administrator_id: adminId,
        open_date: { gte: today.startOf('day').toDate(), lte: today.endOf('day').toDate() },
        status: 'OPEN' as CashRegisterStatus
      }
    });

    if (!cashRegister) {
      return false;
    }

    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return false;
  }
};
