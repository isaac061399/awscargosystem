import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { hasAllPermissions } from '@/helpers/permissions';
import { getConfiguration } from '@/controllers/Configuration.Controller';
import { getPackagesForNewManifest } from '@/controllers/SpecialPackageManifest.Controller';
import { calculateManifestTotal } from '@/helpers/calculations';
import { PaymentStatus, SpecialPackageStatus } from '@/prisma/generated/enums';

export const GET = withAuthApi(['special-package-manifests.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:special-packages', { returnObjects: true, default: {} });

  const admin = req.session;
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    const isAdmin = hasAllPermissions(['special-packages.admin'], admin.permissions);

    // filters
    const where: any = {};
    const search = params.s || '';
    const payment_status = params.payment_status || '';

    if (search.trim() !== '') {
      where['OR'] = [
        { owner: { full_name: { contains: search.trim(), mode: 'insensitive' } } },
        { owner: { email: { contains: search.trim(), mode: 'insensitive' } } }
      ];
      if (!isNaN(parseInt(search.trim()))) {
        where['OR'].push({ id: parseInt(search.trim()) });
      }
    }

    if (payment_status !== '') {
      where['payment_status'] = payment_status;
    }

    if (!isAdmin) {
      where['owner_id'] = admin.id;
    }

    // query
    const manifests = await prismaRead.cusSpecialPackageManifest.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      include: {
        owner: { select: { id: true, full_name: true, email: true } }
      }
    });

    if (!manifests) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.cusSpecialPackageManifest.count({ where });
    const pagination = { total: total || 0, count: manifests?.length || 0 };

    return NextResponse.json({ valid: true, data: manifests, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['special-package-manifests.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:special-package-manifests', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    const isAdmin = hasAllPermissions(['special-package-manifests.admin'], admin.permissions);

    const ownerId = data.owner_id && !isNaN(parseInt(data.owner_id)) ? parseInt(data.owner_id) : null;
    const realOwnerId = !isAdmin ? admin.id : ownerId ? ownerId : 0;

    // get configuration
    const configuration = await getConfiguration();
    if (!configuration) {
      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }

    const specialPackages = await getPackagesForNewManifest(realOwnerId);
    if (specialPackages.length === 0) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notItems }, { status: 400 });
    }

    const amountPerPackage = configuration.special_package_amount || 0;
    const amountPerManifest = configuration.special_package_manifest_amount || 0;
    const quantity = specialPackages.length;
    const totalAmount = calculateManifestTotal(quantity, amountPerPackage, amountPerManifest);

    const result = await withTransaction(async (tx) => {
      // create manifest
      const manifest = await tx.cusSpecialPackageManifest.create({
        data: {
          owner_id: realOwnerId,
          package_quantity: quantity,
          package_amount: amountPerPackage,
          manifest_amount: amountPerManifest,
          amount: totalAmount,
          description: data.description || '',
          payment_status: PaymentStatus.PENDING,
          payment_status_date: new Date(),
          special_packages: {
            connect: specialPackages.map((pkg) => ({ id: pkg.id }))
          }
        }
      });

      if (!manifest) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      // change packages status
      await tx.cusSpecialPackage.updateMany({
        where: { id: { in: specialPackages.map((pkg) => pkg.id) } },
        data: { status: SpecialPackageStatus.PROCESSED, status_date: new Date() }
      });

      return manifest;
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
