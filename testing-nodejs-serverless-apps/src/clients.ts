import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Stages } from './types';

const oldDynamo = new DynamoDBClient({
  ...(process.env.NODE_ENV === Stages.Dev && {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'accessKeyId',
      secretAccessKey: 'secretAccessKey'
    }
  })
});

export const s3 = new S3Client({});
export const sqs = new SQSClient({});
export const dynamodb = DynamoDBDocumentClient.from(oldDynamo);
