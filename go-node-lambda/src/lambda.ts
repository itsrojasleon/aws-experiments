import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { Readable } from 'stream';
import { createGzip } from 'zlib';

const s3 = new S3Client({});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // (1) -> Read file.
    const { Body } = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME!, // Make sure it is defined.
        Key: 'file.txt'
      })
    );

    // (2) -> Compress file.
    const gzip = createGzip()
      .on('error', (err) => {
        throw err;
      })
      .on('data', (chunk) => {
        console.log('Compressed chunk size: ', chunk.length);
      });

    (Body as Readable).pipe(gzip);

    // (3) -> Upload file.
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: 'node/file.txt.gz',
        Body: gzip
      })
    );

    // (4) -> Return response to user.
    return {
      statusCode: 200,
      body: 'File uploaded successfully'
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Something went wrong'
    };
  }
};
