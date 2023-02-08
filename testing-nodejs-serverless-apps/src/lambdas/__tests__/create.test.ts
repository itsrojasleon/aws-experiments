import { mockClient } from 'aws-sdk-client-mock';
import { dynamodb, sqs } from '../../clients';
import { handler } from '../create';

const dynamodbMock = mockClient(dynamodb);
const sqsMock = mockClient(sqs);

describe('create', () => {
  it('should return 400', async () => {
    const event = {
      body: '!@#$%^&*()'
    };

    // @ts-ignore
    const response = await handler(event);
    // @ts-ignore
    expect(response.statusCode).toBe(400);
    // @ts-ignore
    expect(JSON.parse(response.body).message).toBe('Invalid body');
  });

  it('should return 200', async () => {
    const event = {
      body: JSON.stringify({
        name: 'name',
        content: 'content'
      })
    };

    expect(dynamodbMock.calls()).toHaveLength(0);
    expect(sqsMock.calls()).toHaveLength(0);

    // @ts-ignore
    const response = await handler(event);

    expect(dynamodbMock.calls()).toHaveLength(1);
    expect(sqsMock.calls()).toHaveLength(1);

    // @ts-ignore
    expect(response.statusCode).toBe(200);
    // @ts-ignore
    expect(JSON.parse(response.body)).toEqual({
      message: 'Blog post created successfully'
    });
  });
});
