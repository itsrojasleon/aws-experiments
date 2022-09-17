import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { processHealthChecks } from '../utils';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  return processHealthChecks(event);
};
