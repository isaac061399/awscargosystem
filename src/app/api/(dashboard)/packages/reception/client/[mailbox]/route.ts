import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError } from '@libs/prisma';

import { clientSelectSchema } from '@/controllers/Client.Controller';

export const GET = withAuthApi(
  ['packages.reception'],
  async (req, { params }: { params: Promise<{ mailbox: string }> }) => {
    const { mailbox } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:packages-reception', { returnObjects: true, default: {} });

    try {
      const client = await prismaRead.cusClient.findUnique({
        where: { id: parseInt(mailbox.trim()) },
        select: { ...clientSelectSchema, pound_fee: true }
      });

      if (!client) {
        return NextResponse.json({ valid: false, message: textT?.errors?.clientNotFound }, { status: 404 });
      }

      return NextResponse.json({ valid: true, client }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      if (error instanceof TransactionError) {
        return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
      }

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);
