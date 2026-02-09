import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { hasAllPermissions } from '@/helpers/permissions';
import { PaymentStatus } from '@/prisma/generated/browser';

export const POST = withAuthApi(
  ['special-package-manifests.pay'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:special-package-manifests', { returnObjects: true, default: {} });

    const admin = req.session;

    try {
      const isAdmin = hasAllPermissions(['special-package-manifests.admin'], admin.permissions);

      await withTransaction(async (tx) => {
        const where: any = { id: Number(id) };

        if (!isAdmin) {
          where['owner_id'] = admin.id;
        }

        // validate manifest exists and belongs to user (if not admin)
        const entry = await tx.cusSpecialPackageManifest.findFirst({
          where
        });

        if (!entry) {
          throw new TransactionError(400, textT?.errors?.pay);
        }

        if (entry.payment_status === PaymentStatus.PAID) {
          throw new TransactionError(400, textT?.errors?.alreadyPaid);
        }

        // update manifest payment status to PAID
        const result = await tx.cusSpecialPackageManifest.update({
          where: { id: Number(id) },
          data: { payment_status: PaymentStatus.PAID, payment_status_date: new Date() }
        });

        if (!result) {
          throw new TransactionError(400, textT?.errors?.pay);
        }
      });

      return NextResponse.json({ valid: true }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      if (error instanceof TransactionError) {
        return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
      }

      return NextResponse.json({ valid: false, message: textT?.errors?.pay }, { status: 500 });
    }
  }
);
