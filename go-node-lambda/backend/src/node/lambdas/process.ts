import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Handler } from 'aws-lambda';
import { Readable } from 'stream';

const s3 = new S3Client({});

export const handler: S3Handler = async (event) => {
  try {
    const promises = event.Records.map(async (record) => {
      const bucketName = record.s3.bucket.name;
      const key = record.s3.object.key;

      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key
        })
      );

      const readable = Body as Readable;
    });

    await Promise.all(promises);

    // const gzip = createGzip()
    //   .on('error', (err) => {
    //     throw err;
    //   })
    //   .on('data', (chunk) => {
    //     console.log('Compressed chunk size: ', chunk.length);
    //   });

    // (Body as Readable).pipe(gzip);

    // await s3.send(
    //   new PutObjectCommand({
    //     Bucket: process.env.BUCKET_NAME!,
    //     Key: 'node/file.txt.gz',
    //     Body: gzip
    //   })
    // );
  } catch (err) {
    console.error(err);
  }
};
