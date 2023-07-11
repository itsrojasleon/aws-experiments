import { AWS } from '@serverless/typescript';

const serverlessConfig: AWS = {
  service: 'rds-typeorm',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    vpc: {
      securityGroupIds: [''],
      subnetIds: ['', '']
    }
  },
  functions: {
    create: {
      handler: 'src/lambdas/create.handler',
      events: [
        {
          httpApi: {
            method: 'post',
            path: '/users'
          }
        }
      ]
    }
  }
};

module.exports = serverlessConfig;
