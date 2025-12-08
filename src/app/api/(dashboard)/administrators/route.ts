import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { getHash } from '@libs/argon2id';

export const GET = withAuthApi(['administrators.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:administrators', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';

    if (search !== '') {
      where['OR'] = [
        { full_name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { role: { name: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    // query
    const administrators = await prismaRead.administrator.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'asc' }],
      select: {
        id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        email: true,
        role: { select: { id: true, name: true } },
        user: { select: { email: true, enabled: true } }
      }
    });

    if (!administrators) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.administrator.count({ where });
    const pagination = { total: total || 0, count: administrators?.length || 0 };

    return NextResponse.json({ valid: true, data: administrators, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['administrators.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:administrators', { returnObjects: true, default: {} });

  const data = await req.json();
  const email = data.email ? `${data.email}`.trim().toLowerCase() : '';

  try {
    const result = await withTransaction(async (tx) => {
      // email validation
      const exist = await tx.administrator.findFirst({
        where: { email },
        select: { email: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.email);
      }

      // password hashed
      const hashedPassword = await getHash(data.password);

      // admin with relations
      const admin = await tx.administrator.create({
        data: {
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
          full_name: `${data.first_name.trim()} ${data.last_name.trim()}`,
          role: {
            connect: { id: Number(data.role_id) }
          },
          user: {
            connectOrCreate: {
              where: { email },
              create: {
                name: `${data.first_name.trim()} ${data.last_name.trim()}`,
                email,
                password: hashedPassword,
                enabled: true
              }
            }
          }
        },
        include: { user: true }
      });

      if (!admin) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return admin;
    });

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
