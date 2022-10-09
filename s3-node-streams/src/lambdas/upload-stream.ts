import { Upload } from '@aws-sdk/lib-storage';
import { APIGatewayProxyHandler } from 'aws-lambda';
import fs from 'fs';
import { s3 } from '../s3';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    console.time('handleMultiPartUpload');
    const readable = fs.createReadStream('file.txt');

    const parallelUpload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.BUCKET_NAME,
        Key: '/files/mutlipart-upload',
        Body: readable
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false
    });

    parallelUpload.on('httpUploadProgress', (progress) => {
      console.log({ progress });
    });

    await parallelUpload.done();

    console.timeEnd('handleMultiPartUpload');

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
