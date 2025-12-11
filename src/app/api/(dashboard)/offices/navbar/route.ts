import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { prismaRead } from '@libs/prisma';

export const GET = withAuthApi([], async () => {
  try {
    // query
    const offices = await prismaRead.cusOffice.findMany({
      where: { enabled: true },
      orderBy: [{ id: 'asc' }],
      select: { id: true, name: true }
    });

    if (!offices) {
      return NextResponse.json({ valid: true, data: [] }, { status: 200 });
    }

    return NextResponse.json({ valid: true, data: offices }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: true, data: [] }, { status: 200 });
  }
});
