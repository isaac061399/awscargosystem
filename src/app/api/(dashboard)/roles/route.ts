import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';

export const GET = withAuthApi(['roles.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:roles', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};
    const search = params.s || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // query
    const roles = await prismaRead.role.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    if (!roles) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.role.count({ where });
    const pagination = { total: total || 0, count: roles?.length || 0 };

    return NextResponse.json({ valid: true, data: roles, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['roles.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:roles', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: data?.name,
          description: data?.description,
          permissions: {
            create: data?.permissions?.map((p: any) => ({
              permission_id: p
            }))
          }
        }
      });

      if (!role) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return role;
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
