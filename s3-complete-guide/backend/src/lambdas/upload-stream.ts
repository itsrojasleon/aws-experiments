import { PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyHandler } from 'aws-lambda';
import fs from 'fs';
import { s3 } from '../clients/s3';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    console.time('handleStreamUpload');
    const readable = fs.createReadStream('file.txt');

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Body: readable,
      Key: '/files/stream'
    });

    await s3.send(command);

    console.timeEnd('handleStreamUpload');

    return {
      statusCode: 201,
      body: JSON.stringify({ msg: 'File uploaded successfully!' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};
