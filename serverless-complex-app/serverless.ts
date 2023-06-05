import type { AWS } from '@serverless/typescript';
import { Stages } from './src/types';

const IS_DEV = process.env.NODE_ENV === Stages.DEV;

const attachmentsBucketName = 'AttachmentsBucket';

const serverlessConfig: AWS = {
  service: 'serverless-complex-app',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    stage: "${opt:stage, 'development'}",
    runtime: 'nodejs16.x',
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['s3:PutObject'],
        Resource: { 'Fn::GetAtt': [attachmentsBucketName, 'Arn'] }
      }
    ]
  },
  functions: {
    hello: {
      handler: 'src/lambdas/start.handler',
      timeout: 6,
      environment: {
        NODE_ENV: '${self:provider.stage}',
        ATTACHMENTS_BUCKET_NAME: IS_DEV
          ? `${attachmentsBucketName}`
          : { Ref: attachmentsBucketName }
      },
      events: [
        {
          http: {
            method: 'post',
            path: '/'
          }
        }
      ]
    }
  },
  plugins: [
    'serverless-esbuild',
    'serverless-dynamodb-local',
    'serverless-s3-local',
    'serverless-offline'
  ],
  custom: {
    esbuild: {
      bundle: true,
      minify: true,
      exclude: ['@aws-sdk/*']
    },
    s3: {
      host: 'localhost',
      directory: '/tmp',
      silent: true
    },
    dynamodb: {
      stages: ['dev'],
      start: {
        migrate: true,
        docker: true,
        noStart: true
      }
    }
  },
  resources: {
    Resources: {
      [attachmentsBucketName]: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          ...(IS_DEV && {
            BucketName: attachmentsBucketName
          })
        }
      }
    }
  }
};

module.exports = serverlessConfig;
