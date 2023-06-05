import { Upload } from '@aws-sdk/lib-storage';
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
    const letter = 'A';

    const customReadable = Readable.from({
      async *[Symbol.asyncIterator]() {
        let generatedBytes = 0;
        while (generatedBytes < fileSize) {
          const remainingSize = fileSize - generatedBytes;
          const bytesToPush = Math.min(chunkSize, remainingSize);
          const buff = Buffer.alloc(bytesToPush, letter);
          generatedBytes += bytesToPush;
          yield buff;
        }
      }
    });

    const parallelUpload = new Upload({
      client: s3,
      queueSize: 4,
      partSize: chunkSize,
      leavePartsOnError: false,
      params: {
        Bucket: process.env.ATTACHMENTS_BUCKET_NAME,
        Key: `${generateId()}.txt`,
        Body: customReadable
      }
    });

    parallelUpload.on('httpUploadProgress', (progress) => {
      console.log({ progress });
    });

    const data = await parallelUpload.done();
    console.log('upload completed!', { data });

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
