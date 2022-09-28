import {
  LambdaClient,
  UpdateEventSourceMappingCommand
} from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});

export const handler = async (event) => {
  try {
    const { UUID } = JSON.parse(event);

    await lambda.send(
      new UpdateEventSourceMappingCommand({ Enabled: false, UUID })
    );
  } catch (error) {
    console.error({ error });
  }
};
