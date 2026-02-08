import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi(
  ['special-packages.list'],
  async (req, { params }: { params: Promise<{ tracking: string }> }) => {
    const { tracking } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:special-packages', { returnObjects: true, default: {} });

    const trackingTrimmed = tracking.trim();

    try {
      // query
      const specialPackage = await prismaRead.cusSpecialPackage.findUnique({
        where: { tracking: trackingTrimmed },
        include: {
          owner: {
            select: { id: true, full_name: true, email: true }
          }
        }
      });

      if (!specialPackage) {
        return NextResponse.json({ valid: false }, { status: 200 });
      }

      return NextResponse.json({ valid: true, data: specialPackage }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);
