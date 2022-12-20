import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

export const s3 = new S3Client({});
export const sqs = new SQSClient({});
export const dynamo = DynamoDBDocument.from(new DynamoDBClient({}));
