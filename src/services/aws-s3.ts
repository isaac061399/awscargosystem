import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getSignedUrlAWS } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

interface GetSignedUrlParams {
  Bucket: string;
  Key: string;
  Body?: any;
  ContentType?: string;
}

export const getBucketEndpoint = (bucket?: string): string => {
  if (!bucket) {
    bucket = process.env.AWS_S3_BUCKET!;
  }

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
};

export const getSignedUrl = async (params: GetSignedUrlParams): Promise<string> => {
  return await getSignedUrlAWS(s3Client, new PutObjectCommand(params), { expiresIn: 3600 });
};

export const deleteObject = async (bucket: string, key: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });

    await s3Client.send(command);

    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);

    return false;
  }
};
