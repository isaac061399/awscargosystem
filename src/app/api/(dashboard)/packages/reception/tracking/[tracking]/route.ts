import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError } from '@libs/prisma';

import { clientSelectSchema } from '@/controllers/Client.Controller';

export const GET = withAuthApi(
  ['packages.reception'],
  async (req, { params }: { params: Promise<{ tracking: string }> }) => {
    const { tracking } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:packages-reception', { returnObjects: true, default: {} });

    try {
      const packages = await prismaRead.cusPackage.findMany({
        where: { tracking, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] },
        select: {
          id: true,
          client: { select: { ...clientSelectSchema, pound_fee: true } }
        }
      });

      const orders = await prismaRead.cusOrder.findMany({
        where: {
          products: { some: { tracking, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] } },
          AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }]
        },
        select: {
          id: true,
          client: { select: { ...clientSelectSchema, pound_fee: true } },
          products: {
            where: { tracking, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] },
            select: {
              id: true,
              tracking: true
            }
          }
        }
      });

      return NextResponse.json({ valid: true, packages, orders }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      if (error instanceof TransactionError) {
        return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
      }

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);
