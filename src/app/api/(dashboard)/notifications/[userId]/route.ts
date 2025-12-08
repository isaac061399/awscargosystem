import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi(['users.list'], async (req, { params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:notifications', { returnObjects: true, default: {} });

  const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = { user_id: Number(userId) };

    // query
    const notifications = await prismaRead.appNotification.findMany({
      take: queryParams.limit ? parseInt(queryParams.limit) : 100,
      skip: queryParams.offset ? parseInt(queryParams.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        title: true,
        message: true,
        is_read: true,
        created_at: true
      }
    });

    if (!notifications) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.appNotification.count({ where });
    const pagination = { total: total || 0, count: notifications?.length || 0 };

    return NextResponse.json({ valid: true, data: notifications, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
