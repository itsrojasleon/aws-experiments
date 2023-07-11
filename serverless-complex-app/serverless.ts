import type { AWS } from '@serverless/typescript';
import { Stages } from './src/types';

const IS_DEV = process.env.NODE_ENV === Stages.DEV;

const attachmentsBucketName = 'AttachmentsBucketName';

const serverlessConfig: AWS = {
  service: 'serverless-complex-app',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    stage: "${opt:stage, 'development'}",
    runtime: IS_DEV ? 'nodejs16.x' : 'nodejs18.x',
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject'],
            Resource: '*'
          }
        ]
      }
    },
    iamManagedPolicies: [
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    ]
  },
  functions: {
    parallelUpload: {
      handler: 'src/lambdas/parallel-upload.handler',
      timeout: 6,
      environment: {
        NODE_ENV: '${self:provider.stage}',
        ATTACHMENTS_BUCKET_NAME: IS_DEV
          ? `${attachmentsBucketName}`
          : { Ref: 'AttachmentsBucket' }
      },
      events: [
        {
          http: {
            method: 'post',
            path: '/parallel-upload'
          }
        }
      ]
    },
    upload: {
      handler: 'src/lambdas/upload.handler',
      timeout: 6,
      environment: {
        NODE_ENV: '${self:provider.stage}',
        ATTACHMENTS_BUCKET_NAME: IS_DEV
          ? `${attachmentsBucketName}`
          : { Ref: 'AttachmentsBucket' }
      },
      events: [
        {
          http: {
            method: 'post',
            path: '/upload'
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
      AttachmentsBucket: {
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
