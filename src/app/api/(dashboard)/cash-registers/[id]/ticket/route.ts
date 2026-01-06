import { NextResponse } from 'next/server';

import type { CashRegisterStatus } from '@/prisma/generated/client';
import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { getCashRegister, getCashRegisterTicketHtml } from '@/controllers/CashRegister.Controller';
import { generatePdfFromHtml } from '@/helpers/pdf-generator';

export const GET = withAuthApi(
  ['cash-registers.view'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req, ['constants']);
    const textT: any = t('api:cash-registers', { returnObjects: true, default: {} });

    try {
      // validate if register exists for today
      const entry = await getCashRegister(Number(id));

      if (!entry) {
        return NextResponse.json({ valid: false, message: textT?.errors?.invalid }, { status: 400 });
      }

      if (entry.status !== ('CLOSED' as CashRegisterStatus)) {
        return NextResponse.json({ valid: false, message: textT?.errors?.notClose }, { status: 400 });
      }

      const ticketHtml = await getCashRegisterTicketHtml(entry);

      const pdfBuffer = await generatePdfFromHtml(ticketHtml);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="ticket.pdf"'
        }
      });
    } catch (error) {
      console.error(`Error: ${error}`);

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);
