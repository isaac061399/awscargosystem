import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';
import { hasAllPermissions } from '@/helpers/permissions';
import { SpecialPackageStatus } from '@/prisma/generated/browser';
import { getBucketEndpoint } from '@/services/aws-s3';

const bucketEndpoint = getBucketEndpoint();

export const GET = withAuthApi(
  ['special-packages.list'],
  async (req, { params }: { params: Promise<{ tracking: string }> }) => {
    const { tracking } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:special-packages', { returnObjects: true, default: {} });

    const admin = req.session;

    const trackingTrimmed = tracking.trim();

    try {
      const isAdmin = hasAllPermissions(['special-packages.admin'], admin.permissions);

      const where: any = { tracking: trackingTrimmed, status: SpecialPackageStatus.PRE_ALERTED };

      if (!isAdmin) {
        where['owner_id'] = admin.id;
      }

      // query
      const specialPackage = await prismaRead.cusSpecialPackage.findFirst({
        where,
        include: {
          owner: {
            select: { id: true, full_name: true, email: true }
          },
          special_package_documents: {
            select: { id: true, description: true, file: true, file_name: true, file_size: true, file_type: true }
          }
        }
      });

      if (!specialPackage) {
        return NextResponse.json({ valid: false }, { status: 200 });
      }

      // add bucket endpoint to file urls
      const documentsWithUrl = specialPackage.special_package_documents.map((doc) => ({
        ...doc,
        file_url: `${bucketEndpoint}${doc.file}`
      }));

      specialPackage.special_package_documents = documentsWithUrl;

      return NextResponse.json({ valid: true, data: specialPackage }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);
