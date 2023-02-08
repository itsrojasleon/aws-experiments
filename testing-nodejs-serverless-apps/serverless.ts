import type { Serverless } from 'serverless/aws';
import { Stages } from './src/types';

const stage = "${opt:stage, 'testing'}";
const tableName = 'BlogTable';
const queueName = 'Queue';
const isDev = process.env.NODE_ENV === Stages.Dev;

const serverlessConfig: Serverless = {
  service: `blogger-${stage}`,
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_ENV: stage
    },
    iam: {
      role: {
        managedPolicies: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        ],
        statements: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:PutItem'],
            Resource: { 'Fn::GetAtt': ['Table', 'Arn'] }
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: { 'Fn::GetAtt': ['Queue', 'Arn'] }
          }
        ]
      }
    }
  },
  functions: {
    create: {
      handler: './src/lambdas/create.handler',
      environment: {
        TABLE_NAME: isDev ? tableName : { Ref: 'Table' },
        QUEUE_URL: isDev
          ? `http://localhost:9324/000000000000/${queueName}`
          : { 'Fn::GetAtt': [queueName, 'QueueUrl'] }
      },
      events: [
        {
          http: { method: 'post', path: '/blog' }
        }
      ]
    },
    validate: {
      handler: './src/lambdas/validate.handler',
      environment: {
        TABLE_NAME:
          process.env.NODE_ENV === Stages.Dev ? tableName : { Ref: 'Table' }
      },
      events: [
        {
          sqs: {
            arn: isDev
              ? `arn:aws:sqs:region:XXXXXX:${queueName}`
              : { 'Fn::GetAtt': [queueName, 'Arn'] },
            functionResponseType: 'ReportBatchItemFailures'
          }
        }
      ]
    }
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      watch: {
        pattern: ['src/**/*']
      }
    },
    dynamodb: {
      stages: [stage],
      start: {
        migrate: true,
        docker: true,
        noStart: true
      }
    },
    'serverless-offline-sqs': {
      autoCreate: true,
      apiVersion: '2012-11-05',
      endpoint: 'http://localhost:9324',
      region: 'us-east-1',
      accessKeyId: 'root',
      secretAccessKey: 'root',
      skipCacheInvalidation: false
    }
  },
  plugins: [
    'serverless-dynamodb-local',
    'serverless-esbuild',
    'serverless-offline-sqs',
    'serverless-offline'
  ],
  resources: {
    Resources: {
      Table: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          ...(process.env.NODE_ENV === Stages.Dev && {
            TableName: tableName
          }),
          AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
          BillingMode: 'PAY_PER_REQUEST'
        }
      },
      Queue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          ...(process.env.NODE_ENV === Stages.Dev && {
            QueueName: queueName
          })
        }
      }
    }
  }
};

module.exports = serverlessConfig;
