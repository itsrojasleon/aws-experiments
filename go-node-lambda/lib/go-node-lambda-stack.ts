import * as lambdaGo from '@aws-cdk/aws-lambda-go-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class GoNodeLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'bucket');

    new lambdaNode.NodejsFunction(this, 'nodeLambda', {
      entry: '../src/node-lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    });

    new lambdaGo.GoFunction(this, 'goLambda', {
      entry: '../src/go-lambda',
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    });
  }
}
