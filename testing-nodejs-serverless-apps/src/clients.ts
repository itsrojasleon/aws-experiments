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

export const dynamodb = DynamoDBDocumentClient.from(oldDynamo);

export const s3 = new S3Client({
  ...(process.env.NODE_ENV === Stages.Dev && {
    forcePathStyle: true,
    endpoint: 'http://localhost:4569',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'S3RVER',
      secretAccessKey: 'S3RVER'
    }
  })
});

export const sqs = new SQSClient({
  ...(process.env.NODE_ENV === Stages.Dev && {
    apiVersion: '2012-11-05',
    region: 'localhost',
    endpoint: 'http://0.0.0.0:9324',
    sslEnabled: false,
    credentials: {
      secretAccessKey: 'root',
      accessKeyId: 'root'
    }
  })
});
