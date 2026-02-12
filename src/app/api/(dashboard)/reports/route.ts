import { NextResponse } from 'next/server';
import { parse } from 'json2csv';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { getCashRegisterMovement, getCuts, getOrdersReady, getPackagesReady } from '@/controllers/Reports.Controller';

export const GET = withAuthApi(['reports.view'], async (req) => {
  const { t } = await initTranslationsApi(req, ['constants']);
  const textT: any = t('api:reports', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const type = params.t;
    const officeId = params.oi && !isNaN(parseInt(params.oi)) ? parseInt(params.oi) : undefined;
    const startDate = params.sd;
    const endDate = params.ed;

    let reportData;

    switch (type) {
      case 'packagesReady':
        reportData = await getPackagesReady(textT?.types?.packagesReady, { officeId, startDate, endDate });
        break;
      case 'ordersReady':
        reportData = await getOrdersReady(textT?.types?.ordersReady, { officeId, startDate, endDate });
        break;
      case 'cashRegisterMovement':
        reportData = await getCashRegisterMovement(textT?.types?.cashRegisterMovement, {
          officeId,
          startDate,
          endDate
        });
        break;
      case 'packageCuts':
        reportData = await getCuts(textT?.types?.packageCuts);
        break;
      default:
        return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 400 });
    }

    const csv = parse(reportData.data, { fields: reportData.headers });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${reportData.documentName}.csv`
      }
    });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
