import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { getSignedUrl } from '@services/aws-s3';

const S3_BUCKET = process.env.AWS_S3_BUCKET!;
const uploadFolder = 'media/';

export const GET = withAuthApi(['media.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:media', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // pagination
    const { fileName, fileType } = params;

    if (!fileName || !fileType) {
      return NextResponse.json({ valid: false, message: textT?.errors?.requiredParams }, { status: 400 });
    }

    const fileKey = `${uploadFolder}${Date.now()}-${fileName}`;

    const signedParams = {
      Bucket: S3_BUCKET,
      Key: fileKey,
      ContentType: fileType,
      ACL: 'public-read' as const
    };

    const signedUrl = await getSignedUrl(signedParams);

    if (!signedUrl) {
      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 400 });
    }

    return NextResponse.json({ valid: true, url: signedUrl, key: fileKey }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
