import { type NextRequest, NextResponse } from 'next/server';

import { prismaRead } from '@libs/prisma';

export const GET = async (req: NextRequest, { params }: { params: Promise<{ email: string }> }) => {
  const { email } = await params;

  try {
    const admin = await prismaRead.administrator.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, enabled_2fa: true }
    });

    if (!admin) {
      return NextResponse.json({ required: false }, { status: 200 });
    }

    return NextResponse.json({ required: admin.enabled_2fa }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ required: false }, { status: 200 });
  }
};
