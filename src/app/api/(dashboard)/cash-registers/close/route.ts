import { NextResponse } from 'next/server';
import moment from 'moment';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { getCashData, getCashRegisterAdmin, getCashRegisterData } from '@/controllers/CashRegister.Controller';
import { CashRegisterStatus, Currency } from '@/prisma/generated/enums';

export const POST = withAuthApi(['cash-control.close'], async (req) => {
  const { t } = await initTranslationsApi(req, ['constants']);
  const textT: any = t('api:cash-registers', { returnObjects: true, default: {} });
  const moneyT: any = t('constants:money', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    await withTransaction(async (tx) => {
      // validate if register exists for today
      const entry = await getCashRegisterAdmin(admin.email);

      if (!entry) {
        throw new TransactionError(400, textT?.errors?.notOpen);
      }

      if (entry.status === CashRegisterStatus.CLOSED) {
        throw new TransactionError(400, textT?.errors?.alreadyClosed);
      }

      const closeDate = moment();
      const closeDataCRC = await getCashRegisterData(Currency.CRC, entry);
      const closeDataUSD = await getCashRegisterData(Currency.USD, entry);
      const cashDataCRC = getCashData(moneyT?.CRC || {}, data.crc || {});
      const cashDataUSD = getCashData(moneyT?.USD || {}, data.usd || {});

      const cashRegister = await tx.cusCashRegister.update({
        where: { id: entry.id },
        data: {
          close_date: closeDate.toDate(),
          invoice_count: closeDataCRC.invoice_count,
          comment: data.comment || '',
          status: CashRegisterStatus.CLOSED,
          lines: {
            updateMany: [
              {
                where: { currency: Currency.CRC },
                data: {
                  cash_reported: cashDataCRC.total,
                  cash_reported_data: cashDataCRC.details,
                  cash_in: closeDataCRC.cash_in,
                  sinpe_in: closeDataCRC.sinpe_in,
                  transfer_in: closeDataCRC.transfer_in,
                  card_in: closeDataCRC.card_in,
                  cash_out: closeDataCRC.cash_out,
                  sinpe_out: closeDataCRC.sinpe_out,
                  transfer_out: closeDataCRC.transfer_out,
                  card_out: closeDataCRC.card_out,
                  cash_change: closeDataCRC.cash_change,
                  sinpe_change: closeDataCRC.sinpe_change,
                  transfer_change: closeDataCRC.transfer_change,
                  card_change: closeDataCRC.card_change
                }
              },
              {
                where: { currency: Currency.USD },
                data: {
                  cash_reported: cashDataUSD.total,
                  cash_reported_data: cashDataUSD.details,
                  cash_in: closeDataUSD.cash_in,
                  sinpe_in: closeDataUSD.sinpe_in,
                  transfer_in: closeDataUSD.transfer_in,
                  card_in: closeDataUSD.card_in,
                  cash_out: closeDataUSD.cash_out,
                  sinpe_out: closeDataUSD.sinpe_out,
                  transfer_out: closeDataUSD.transfer_out,
                  card_out: closeDataUSD.card_out,
                  cash_change: closeDataUSD.cash_change,
                  sinpe_change: closeDataUSD.sinpe_change,
                  transfer_change: closeDataUSD.transfer_change,
                  card_change: closeDataUSD.card_change
                }
              }
            ]
          }
        }
      });

      if (!cashRegister) {
        throw new TransactionError(400, textT?.errors?.close);
      }

      return cashRegister;
    });

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
