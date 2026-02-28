import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';

import { getActivityCodes } from '@/services/hacienda';

export const GET = withAuthApi(['clients.edit'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:clients', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const identification = params.identification || '';

    const codes = await getActivityCodes(identification);

    return NextResponse.json({ valid: true, data: codes }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
