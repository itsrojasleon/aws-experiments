import { PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { s3 } from '../s3';
import { createReadableStream, toUppercaseTransform } from '../utils';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const dataSizeInMB = 100;
    const chunkSizeInBytes = 1024 * 1024 * 5;
    const readable = createReadableStream(dataSizeInMB, chunkSizeInBytes);
    const transform = toUppercaseTransform();
    const output = new PassThrough();

    const key = `/files/stream-upload/${Date.now()}.txt`;

    await pipeline(readable, transform, output);
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: output
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'File uploaded successfully!', key })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};
