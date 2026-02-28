import { NextResponse } from 'next/server';
import moment from 'moment';

import { getBuyingExchangeRate, getSellingExchangeRate } from '@/services/bccr';
import { prismaWrite } from '@/libs/prisma';
import { defaultConfigId } from '@/libs/constants';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // Security: Vercel recommends CRON_SECRET (sent as Authorization header automatically)
    const auth = req.headers.get('authorization') || '';
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || auth !== expected) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const today = moment();

    const sellingExchangeRate = await getSellingExchangeRate(today.clone());
    const buyingExchangeRate = await getBuyingExchangeRate(today.clone());

    if (sellingExchangeRate !== null || buyingExchangeRate !== null) {
      await prismaWrite.cusConfiguration.update({
        where: { id: defaultConfigId },
        data: {
          selling_exchange_rate: sellingExchangeRate || undefined,
          buying_exchange_rate: buyingExchangeRate || undefined,
          updated_exchange_rate: today.clone().toDate()
        }
      });
    }

    return NextResponse.json({ ok: true, ranAt: today.clone().toISOString() });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
