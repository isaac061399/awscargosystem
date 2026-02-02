import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';

import { getTrackingHistory } from '@/controllers/Tracking.Controller';

export const GET = withAuthApi(
  ['packages.track'],
  async (req, { params }: { params: Promise<{ tracking: string }> }) => {
    const { tracking } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:packages-tracking', { returnObjects: true, default: {} });

    const trackingTrimmed = tracking.trim();

    try {
      const data = await getTrackingHistory(trackingTrimmed);

      return NextResponse.json({ valid: true, data }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);
