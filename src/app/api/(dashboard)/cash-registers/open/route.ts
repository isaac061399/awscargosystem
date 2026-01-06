import { NextResponse } from 'next/server';
import moment from 'moment';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { getCashRegisterAdmin } from '@/controllers/CashRegister.Controller';
import { CashRegisterStatus, Currency } from '@/prisma/generated/enums';

export const POST = withAuthApi(['cash-control.open'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:cash-registers', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  const officeId = admin.office ? admin.office.id : parseInt(data.office_id);

  try {
    await withTransaction(async (tx) => {
      // validate if register exists for today
      const entry = await getCashRegisterAdmin(admin.email);

      if (entry) {
        throw new TransactionError(400, textT?.errors?.alreadyOpen);
      }

      const register = await tx.cusCashRegister.create({
        data: {
          administrator_id: admin.id,
          office_id: officeId,
          open_date: moment().toDate(),
          status: CashRegisterStatus.OPEN,
          lines: {
            create: [
              { currency: Currency.CRC, cash_balance: parseFloat(data.cash_balance_crc) },
              { currency: Currency.USD, cash_balance: parseFloat(data.cash_balance_usd) }
            ]
          }
        }
      });

      if (!register) {
        throw new TransactionError(400, textT?.errors?.open);
      }

      return register;
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
