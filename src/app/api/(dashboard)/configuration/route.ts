import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { saveConfiguration } from '@controllers/Configuration.Controller';

export const PUT = withAuthApi(['configuration.edit'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:configuration', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await saveConfiguration(data);

    if (!result) {
      return NextResponse.json({ valid: false, message: textT?.errors?.save }, { status: 400 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
