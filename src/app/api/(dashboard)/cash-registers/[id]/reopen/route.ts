import { NextResponse } from 'next/server';

import { Prisma } from '@/prisma/generated/client';
import type { CashRegisterStatus } from '@/prisma/generated/client';
import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaWrite } from '@libs/prisma';
import { getCashRegister } from '@/controllers/CashRegister.Controller';

export const PUT = withAuthApi(
  ['cash-registers.reopen'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:cash-registers', { returnObjects: true, default: {} });

    try {
      // validate if register exists and can be opened
      const entry = await getCashRegister(Number(id), true, true);

      if (!entry) {
        return NextResponse.json({ valid: false, message: textT?.errors?.invalid }, { status: 400 });
      }

      const result = await prismaWrite.cusCashRegister.update({
        where: { id: entry.id },
        data: {
          close_date: null,
          cash_reported: null,
          cash_reported_data: Prisma.DbNull,
          cash_amount: null,
          sinpe_amount: null,
          transfer_amount: null,
          card_amount: null,
          cash_outflows: null,
          sinpe_outflows: null,
          transfer_outflows: null,
          card_outflows: null,
          status: 'OPEN' as CashRegisterStatus
        }
      });

      if (!result) {
        return NextResponse.json({ valid: false, message: textT?.errors?.reopen }, { status: 400 });
      }

      return NextResponse.json({ valid: true }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);
