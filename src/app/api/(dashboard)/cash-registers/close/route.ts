import { NextResponse } from 'next/server';
import moment from 'moment';

import type { CashRegisterStatus } from '@/prisma/generated/client';
import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaWrite } from '@libs/prisma';
import { getCashData, getCashRegisterAdmin, getCashRegisterData } from '@/controllers/CashRegister.Controller';

export const POST = withAuthApi(['cash.close'], async (req) => {
  const { t } = await initTranslationsApi(req, ['constants']);
  const textT: any = t('api:cash-registers', { returnObjects: true, default: {} });
  const labelsT: any = t('constants:labels', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    // validate if register exists for today
    const entry = await getCashRegisterAdmin(admin.email);

    if (!entry) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notOpen }, { status: 400 });
    }

    if (entry.status === ('CLOSED' as CashRegisterStatus)) {
      return NextResponse.json({ valid: false, message: textT?.errors?.alreadyClosed }, { status: 400 });
    }

    const closeDate = moment();
    const closeData = await getCashRegisterData(entry, closeDate);
    const cashData = getCashData(labelsT?.cashMoney || {}, data.cash || {});

    const result = await prismaWrite.cusCashRegister.update({
      where: { id: entry.id },
      data: {
        administrator_id: admin.id,
        close_date: closeDate.toDate(),
        cash_reported: cashData.total,
        cash_reported_data: JSON.stringify(cashData.details),
        cash_amount: closeData.cash_amount,
        sinpe_amount: closeData.sinpe_amount,
        transfer_amount: closeData.transfer_amount,
        card_amount: closeData.card_amount,
        cash_outflows: closeData.cash_outflows,
        sinpe_outflows: closeData.sinpe_outflows,
        transfer_outflows: closeData.transfer_outflows,
        card_outflows: closeData.card_outflows,
        comment: data.comment || '',
        status: 'CLOSED' as CashRegisterStatus
      }
    });

    if (!result) {
      return NextResponse.json({ valid: false, message: textT?.errors?.open }, { status: 400 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
