import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
// import { isAdminCashRegisterOpen } from '@/controllers/CashRegister.Controller';

export const DELETE = withAuthApi(
  ['money-outflows.delete'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:money-outflows', { returnObjects: true, default: {} });

    const admin = req.session;

    try {
      // validate if admin has open cash register
      // const isCashOpen = await isAdminCashRegisterOpen(admin.id);

      // if (!isCashOpen) {
      //   return NextResponse.json({ valid: false, message: textT?.errors?.noOpenCash }, { status: 400 });
      // }

      await withTransaction(async (tx) => {
        // get money outflow
        const entry = await tx.cusMoneyOutflow.findUnique({
          where: { id: Number(id) }
        });

        if (!entry) {
          throw new TransactionError(404, textT?.errors?.delete);
        }

        // delete money outflow
        const result = await tx.cusMoneyOutflow.delete({
          where: { id: Number(id) }
        });

        if (!result) {
          throw new TransactionError(400, textT?.errors?.delete);
        }

        // save log
        await tx.cusMoneyOutflowLog.create({
          data: {
            administrator_id: admin.id,
            action: 'money-outflow.delete',
            data: JSON.stringify(entry)
          }
        });
      });

      return NextResponse.json({ valid: true }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      if (error instanceof TransactionError) {
        return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
      }

      return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 500 });
    }
  }
);
