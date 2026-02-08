import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { hasAllPermissions } from '@/helpers/permissions';

export const DELETE = withAuthApi(
  ['special-packages.delete'],
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:special-packages', { returnObjects: true, default: {} });

    const admin = req.session;

    try {
      const isAdmin = hasAllPermissions(['special-packages.admin'], admin.permissions);

      await withTransaction(async (tx) => {
        const where: any = { id: Number(id) };

        if (!isAdmin) {
          where['owner_id'] = admin.id;
        }

        // delete special-package
        const entry = await tx.cusSpecialPackage.findFirst({
          where
        });

        if (!entry) {
          throw new TransactionError(400, textT?.errors?.delete);
        }

        const result = await tx.cusSpecialPackage.delete({
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
