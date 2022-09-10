import { PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyHandler } from 'aws-lambda';
import buffer from 'buffer';
import fs from 'fs/promises';
import { s3 } from '../clients/s3';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    console.log(
      'buffer MAX_LENGTH: ',
      (buffer.constants.MAX_LENGTH + 1) / 2 ** 30
    );

    const file = await fs.readFile('file.txt');

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Body: file,
      Key: '/files/buffer'
    });

    await s3.send(command);
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
