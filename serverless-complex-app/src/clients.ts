import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Stages } from './types';

export const s3 = new S3Client({
  ...(process.env.NODE_ENV === Stages.DEV && {
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'S3RVER',
      secretAccessKey: 'S3RVER'
    },
    endpoint: 'http://localhost:4569'
  })
});
const oldDynamoDBClient = new DynamoDBClient({
  ...(process.env.NODE_ENV === Stages.DEV && {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'accessKeyId',
      secretAccessKey: 'secretAccessKey'
    }
  })
});

export const dynamo = DynamoDBDocumentClient.from(oldDynamoDBClient);
