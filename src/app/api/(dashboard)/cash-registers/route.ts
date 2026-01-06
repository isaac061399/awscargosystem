import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi(['cash-registers.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:cash-registers', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';

    if (search !== '') {
      where['OR'] = [
        { administrator: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { administrator: { email: { contains: search.trim(), mode: 'insensitive' } } },
        { office: { name: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    if (status !== '') {
      where['status'] = status;
    }

    // query
    const cashRegisters = await prismaRead.cusCashRegister.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        open_date: true,
        close_date: true,
        status: true,
        created_at: true,
        administrator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            full_name: true,
            email: true
          }
        },
        office: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!cashRegisters) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusCashRegister.count({ where });
    const pagination = { total: total || 0, count: cashRegisters?.length || 0 };

    return NextResponse.json({ valid: true, data: cashRegisters, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
