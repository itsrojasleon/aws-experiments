import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';

const s3 = new S3Client({}),
  sqs = new SQSClient({});

export { s3, sqs };
