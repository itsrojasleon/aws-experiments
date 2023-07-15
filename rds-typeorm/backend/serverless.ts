import { AWS } from '@serverless/typescript';

const serverlessConfig: AWS = {
  service: 'rds-typeorm',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    vpc: {
      securityGroupIds: ['${cf:InfraStack.LambdaSecurityGroupId}'],
      subnetIds: [
        '${cf:InfraStack.LambdaSubnet1Id}',
        '${cf:InfraStack.LambdaSubnet2Id}'
      ]
    }
  },
  functions: {
    create: {
      handler: 'src/lambdas/create.handler',
      environment: {
        DB_NAME: '${cf:InfraStack.DatabaseName}',
        DB_HOST: '${cf:InfraStack.DatabaseHostname}',
        // We'll use secrets manager to retrieve the username and password
        // based on the secret ARN.
        DB_SECRET_NAME: '${cf:InfraStack.DatabaseSecretName}'
      },
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
