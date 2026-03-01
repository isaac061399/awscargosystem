import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

import { PackageStatus } from '@/prisma/generated/enums';
import { calculateShippingPrice } from '@/helpers/calculations';

export const PUT = withAuthApi(['packages.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:packages', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    const billingWeight = data.billing_weight ? Number(data.billing_weight) : 0;

    const result = await withTransaction(async (tx) => {
      const entry = await tx.cusPackage.findFirst({
        where: { id: Number(id) }
      });

      if (!entry) {
        throw new TransactionError(400, textT?.errors?.notFound);
      }

      if (entry.status !== PackageStatus.ON_THE_WAY && entry.status !== PackageStatus.READY) {
        throw new TransactionError(400, textT?.errors?.invalid);
      }

      const pkg = await tx.cusPackage.update({
        where: { id: Number(id) },
        data: {
          billing_weight: billingWeight,
          billing_amount: calculateShippingPrice(billingWeight.toString(), entry.billing_pound_fee)
        }
      });

      if (!pkg) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      // edit cut log
      await tx.cusCutLog.updateMany({
        where: { package_id: pkg.id, tracking: pkg.tracking },
        data: {
          weight: billingWeight
        }
      });

      // save log
      await tx.cusPackageLog.create({
        data: {
          package_id: pkg.id,
          administrator_id: admin.id,
          action: 'package.edit',
          data: data
        }
      });

      return pkg;
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

export const DELETE = withAuthApi(['packages.delete'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:packages', { returnObjects: true, default: {} });

  const admin = req.session;

  try {
    await withTransaction(async (tx) => {
      // delete package
      const entry = await tx.cusPackage.findFirst({
        where: { id: Number(id) }
      });

      if (!entry) {
        throw new TransactionError(400, textT?.errors?.delete);
      }

      const result = await tx.cusPackage.delete({
        where: { id: Number(id) }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.delete);
      }

      // save log
      await tx.cusPackageLog.create({
        data: {
          administrator_id: admin.id,
          action: 'package.delete',
          data: entry
        }
      });
    });

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 500 });
  }
});
