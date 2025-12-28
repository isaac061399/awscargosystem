import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';

export const POST = withAuthApi(['packages.reception'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:packages-reception', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      // verify tracking
      const exist = await tx.cusUnownedPackage.findFirst({
        where: { tracking: data.tracking },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.tracking);
      }

      // create package
      const result = await tx.cusUnownedPackage.create({
        data: {
          office_id: parseInt(data.office_id),
          tracking: data.tracking,
          description: data.description
        }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.trackingSave);
      }

      return result;
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
