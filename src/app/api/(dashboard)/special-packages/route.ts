import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import { hasAllPermissions } from '@/helpers/permissions';
import { getBucketEndpoint } from '@/services/aws-s3';

const bucketEndpoint = getBucketEndpoint();

export const GET = withAuthApi(['special-packages.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:special-packages', { returnObjects: true, default: {} });

  const admin = req.session;
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    const isAdmin = hasAllPermissions(['special-packages.admin'], admin.permissions);

    // filters
    const where: any = {};
    const search = params.s || '';
    const status = params.status || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { tracking: { contains: search.trim(), mode: 'insensitive' } },
        { mailbox: { contains: search.trim(), mode: 'insensitive' } },
        { owner: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { owner: { email: { contains: search.trim(), mode: 'insensitive' } } }
      ];
    }

    if (status !== '') {
      where['status'] = status;
    }

    if (!isAdmin) {
      where['owner_id'] = admin.id;
    }

    // query
    const specialPackages = await prismaRead.cusSpecialPackage.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      include: {
        owner: { select: { id: true, full_name: true, email: true } },
        special_package_documents: {
          select: { id: true, description: true, file: true, file_name: true, file_size: true, file_type: true }
        }
      }
    });

    if (!specialPackages) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusSpecialPackage.count({ where });
    const pagination = { total: total || 0, count: specialPackages?.length || 0 };

    const specialPackagesWithUrl = specialPackages.map((pkg) => {
      const documentsWithUrl = pkg.special_package_documents.map((doc) => ({
        ...doc,
        file_url: `${bucketEndpoint}${doc.file}`
      }));

      return { ...pkg, special_package_documents: documentsWithUrl };
    });

    return NextResponse.json({ valid: true, data: specialPackagesWithUrl, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
