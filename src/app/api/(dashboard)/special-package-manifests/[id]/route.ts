import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { hasAllPermissions } from '@/helpers/permissions';
import { SpecialPackageStatus } from '@/prisma/generated/browser';

export const DELETE = withAuthApi(
  ['special-package-manifests.delete'],
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
          throw new TransactionError(400, textT?.errors?.delete);
        }

        // set manifest_id to null and status to RECEIVED for all related packages
        await tx.cusSpecialPackage.updateMany({
          where: { special_package_manifest_id: entry.id },
          data: {
            special_package_manifest_id: null,
            status: SpecialPackageStatus.RECEIVED,
            status_date: new Date()
          }
        });

        // delete manifest
        const result = await tx.cusSpecialPackageManifest.delete({
          where: { id: Number(id) }
        });

        if (!result) {
          throw new TransactionError(400, textT?.errors?.delete);
        }
      });

      return NextResponse.json({ valid: true }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      if (error instanceof TransactionError) {
        return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
      }

      return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 500 });
    }
  }
);
