import { S3Client } from '@aws-sdk/client-s3';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Upload } from '@aws-sdk/lib-storage';
import archive from 'archiver';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { PassThrough, Readable } from 'stream';

interface File {
  content: string;
  name: string;
}

const s3 = new S3Client({});
const sqs = new SQSClient({});

const upload = (key: string, stream: Readable) => {
  const parallelUpload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.BUCKET_NAME,
      Key: `${key}.zip`,
      Body: stream,
      ContentEncoding: 'gzip'
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false
  });

  return parallelUpload.done();
};

const createZip = async (files: File[]) => {
  const passThrough = new PassThrough();

  const zipper = archive('zip', { zlib: { level: 9 } })
    .on('error', (err) => {
      throw err;
    })
    .on('warning', (err) => {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    });

  files.map(({ content, name }) => {
    zipper.append(content, { name });
  });
  zipper.pipe(passThrough);

  await zipper.finalize();

  return passThrough;
};

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const aZip = await createZip([{ name: 'a.txt', content: 'a' }]);
    const bZip = await createZip([{ name: 'b.txt', content: 'b' }]);
    const cZip = await createZip([{ name: 'c.txt', content: 'c' }]);

    await Promise.all([
      upload('files/a', aZip),
      upload('files/b', bZip),
      upload('files/c', cZip)
    ]);

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify({ prefix: 'files' })
      })
    );
    return {
      statusCode: 201,
      body: JSON.stringify('Uploaded!')
    };
  } catch (error) {
    return {
      statusCode: 201,
      body: JSON.stringify({
        error: `Something went wrong uploading zip files: ${error}`
      })
    };
  }
};
