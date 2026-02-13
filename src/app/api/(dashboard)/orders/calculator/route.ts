import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { calculateTaxes, getOrderCalculatorResult } from '@/helpers/calculations';

import { getConfiguration } from '@/controllers/Configuration.Controller';

export const GET = withAuthApi(['orders.calculator'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:orders', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // params
    const quantity = parseInt(params.quantity);
    const unit_price = parseFloat(params.unit_price);
    const unit_weight = parseFloat(params.unit_weight);

    if (isNaN(quantity) || isNaN(unit_price) || isNaN(unit_weight)) {
      return NextResponse.json({ valid: false, message: textT?.errors?.invalidParameters }, { status: 400 });
    }

    // get configuration
    const configuration = await getConfiguration();
    if (!configuration) {
      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 400 });
    }

    // calculations
    const result = getOrderCalculatorResult(quantity, unit_price, unit_weight);

    const tax = calculateTaxes(result.total, configuration.iva_percentage);

    return NextResponse.json({ valid: true, data: { ...result, ...tax } }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
