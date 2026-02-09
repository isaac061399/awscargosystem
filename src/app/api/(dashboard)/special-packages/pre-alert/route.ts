import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { SpecialPackageStatus, SpecialPackageType } from '@/prisma/generated/enums';
import { hasAllPermissions } from '@/helpers/permissions';

export const POST = withAuthApi(['special-packages.pre-alert'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:special-packages', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  const id = data.id && !isNaN(parseInt(data.id)) ? parseInt(data.id) : null;
  const ownerId = data.owner_id && !isNaN(parseInt(data.owner_id)) ? parseInt(data.owner_id) : null;
  const trimmedTracking = data.tracking ? data.tracking.trim() : '';

  try {
    const isAdmin = hasAllPermissions(['special-packages.admin'], admin.permissions);

    const result = await withTransaction(async (tx) => {
      // if id is provided, we are updating an existing entry, otherwise we are creating a new one
      let entryToUpdate;
      if (id) {
        entryToUpdate = await tx.cusSpecialPackage.findUnique({ where: { id } });

        if (!entryToUpdate) {
          throw new TransactionError(404, textT?.errors?.notFound);
        }

        if (entryToUpdate.status !== SpecialPackageStatus.PRE_ALERTED) {
          throw new TransactionError(400, textT?.errors?.exists);
        }
      } else {
        // check if tracking already exists
        const existingEntry = await tx.cusSpecialPackage.findUnique({ where: { tracking: trimmedTracking } });

        if (existingEntry) {
          throw new TransactionError(400, textT?.errors?.exists);
        }
      }

      // validate if owner exists and if logged admin has permissions to assign to that owner
      let ownerLoadedId;
      if (ownerId) {
        if (isAdmin) {
          ownerLoadedId = ownerId;
        } else {
          ownerLoadedId = admin.id;
        }
      } else {
        ownerLoadedId = admin.id;
      }

      // delete documents marked for deletion
      if (data.documentsToDelete && Array.isArray(data.documentsToDelete) && data.documentsToDelete.length > 0) {
        await tx.cusSpecialPackageDocument.deleteMany({
          where: { id: { in: data.documentsToDelete } }
        });
      }

      // load data to save
      const saveData = {
        owner_id: ownerLoadedId,
        mailbox: data.mailbox || '',
        type: data.type || SpecialPackageType.MARITIME,
        indications: data.indications || '',
        special_package_documents:
          data.documentsToAdd && Array.isArray(data.documentsToAdd) && data.documentsToAdd.length > 0
            ? {
                create: data.documentsToAdd.map((doc: any) => ({
                  description: doc.description || '',
                  file: doc.file || '',
                  file_name: doc.file_name || '',
                  file_size: Number(doc.file_size) || 0,
                  file_type: doc.file_type || ''
                }))
              }
            : undefined
      };

      let specialPackage;
      if (entryToUpdate) {
        specialPackage = await tx.cusSpecialPackage.update({
          where: { id: entryToUpdate.id },
          data: saveData
        });
      } else {
        specialPackage = await tx.cusSpecialPackage.create({
          data: {
            ...saveData,
            tracking: trimmedTracking,
            status: SpecialPackageStatus.PRE_ALERTED,
            status_date: new Date()
          }
        });
      }

      if (!specialPackage) {
        throw new TransactionError(400, textT?.errors?.preAlert);
      }

      return specialPackage;
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
