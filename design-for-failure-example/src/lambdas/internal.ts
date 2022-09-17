import { GetObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { Upload } from '@aws-sdk/lib-storage';
import {
  APIGatewayProxyHandler,
  SQSBatchResponse,
  SQSHandler
} from 'aws-lambda';
import fetch from 'node-fetch';
import { consumers, Readable } from 'stream';
import { s3, sqs } from '../clients';
import { GetProductsEvent, Product, ProductRequest } from '../types';
import { validateEnvVars } from '../utils';

export const createRequest: APIGatewayProxyHandler = async (event) => {
  validateEnvVars(['BUCKET_NAME', 'REQUEST_CREATION_QUEUE_URL']);

  try {
    const { productId, reason }: ProductRequest = JSON.parse(event.body ?? '');

    if (!productId || !reason) {
      throw new Error('Must provide productId and message properties');
    }
    if (reason !== 'purchase' && reason !== 'question') {
      throw new Error('reason must be "purchase" or "question"');
    }

    const bucketPath = `requests/${(Math.random() + 1)
      .toString(36)
      .substring(7)}.json`;

    const multiPartUpload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.BUCKET_NAME,
        Key: bucketPath,
        Body: JSON.stringify({ productId, reason }),
        ContentType: 'application/json'
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false
    });

    await multiPartUpload.done();

    const eventMessage: GetProductsEvent = {
      bucketPath
    };

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.REQUEST_CREATION_QUEUE_URL,
        MessageBody: JSON.stringify(eventMessage)
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ msg: 'hello there' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};

export const redirectTraffic: SQSHandler = async (
  event
): Promise<SQSBatchResponse> => {
  validateEnvVars(['BUCKET_NAME', 'EXTERNAL_API_URL']);
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const { bucketPath }: GetProductsEvent = JSON.parse(record.body);

      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: bucketPath
        })
      );

      const readableBody = Body as Readable;
      const { productId, reason } = (await consumers.json(
        readableBody
      )) as ProductRequest;

      const res = await fetch(`${process.env.EXTERNAL_API_URL!}/${productId}`);
      const data = (await res.json()) as Product;

      if (reason === 'question') {
      } else {
      }
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.all(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};

export const solveQuestion: SQSHandler = async (
  event
): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      console.log('Question solved!');
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.all(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};

export const solvePurchase: SQSHandler = async (
  event
): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      console.log('Purchase solved!');
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.all(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
