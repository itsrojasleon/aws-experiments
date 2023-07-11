import { PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Readable } from 'stream';
import { s3 } from '../clients';
import { generateId } from '../utils';

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    if (!process.env.NODE_ENV) {
      throw new Error('NODE_ENV is not defined');
    }
    if (!process.env.ATTACHMENTS_BUCKET_NAME) {
      throw new Error('ATTACHMENTS_BUCKET_NAME is not defined');
    }

    const fileSize = 128 * 1024 * 1024; // 128 MB
    const chunkSize = 5 * 1024 * 1024; // 5 MB

    const customReadable = Readable.from({
      async *[Symbol.asyncIterator]() {
        let generatedBytes = 0;
        while (generatedBytes < fileSize) {
          const remainingSize = fileSize - generatedBytes;
          const bytesToPush = Math.min(chunkSize, remainingSize);
          const buff = Buffer.alloc(bytesToPush, 'A');
          generatedBytes += bytesToPush;
          yield buff;
        }
      }
    });

    const res = await s3.send(
      new PutObjectCommand({
        Bucket: process.env.ATTACHMENTS_BUCKET_NAME,
        Key: `${generateId()}.txt`,
        Body: customReadable
      })
    );
    console.log({ res });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'ok' })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify(err)
    };
  }
};
