import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { getCashRegister } from '@/controllers/CashRegister.Controller';
import { CashRegisterStatus, Currency } from '@/prisma/generated/enums';
import { Prisma } from '@/prisma/generated/client';

export const PUT = withAuthApi(
  ['cash-registers.reopen'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:cash-registers', { returnObjects: true, default: {} });

    try {
      await withTransaction(async (tx) => {
        // validate if register exists and can be opened
        const entry = await getCashRegister(Number(id), true, true);

        if (!entry) {
          throw new TransactionError(400, textT?.errors?.invalid);
        }

        const cashRegister = await tx.cusCashRegister.update({
          where: { id: entry.id },
          data: {
            close_date: null,
            comment: null,
            status: CashRegisterStatus.OPEN,
            lines: {
              updateMany: [
                {
                  where: { currency: Currency.CRC },
                  data: {
                    cash_reported: null,
                    cash_reported_data: Prisma.DbNull,
                    cash_in: null,
                    sinpe_in: null,
                    transfer_in: null,
                    card_in: null,
                    cash_out: null,
                    sinpe_out: null,
                    transfer_out: null,
                    card_out: null,
                    cash_change: null,
                    sinpe_change: null,
                    transfer_change: null,
                    card_change: null
                  }
                },
                {
                  where: { currency: Currency.USD },
                  data: {
                    cash_reported: null,
                    cash_reported_data: Prisma.DbNull,
                    cash_in: null,
                    sinpe_in: null,
                    transfer_in: null,
                    card_in: null,
                    cash_out: null,
                    sinpe_out: null,
                    transfer_out: null,
                    card_out: null,
                    cash_change: null,
                    sinpe_change: null,
                    transfer_change: null,
                    card_change: null
                  }
                }
              ]
            }
          }
        });

        if (!cashRegister) {
          throw new TransactionError(400, textT?.errors?.reopen);
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
  }
);
