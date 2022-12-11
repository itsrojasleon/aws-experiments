// import * as lambdaGo from '@aws-cdk/aws-lambda-go-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export class GoNodeLambdaStack extends cdk.Stack {
  private bucket: s3.Bucket;
  private processLambda: lambdaNode.NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // new lambdaGo.GoFunction(this, 'goLambda', {
    //   entry: '../src/go/lambdas/process',
    //   environment: {
    //     BUCKET_NAME: bucket.bucketName
    //   }
    // });
    this.buildBucket();
    this.buildLambdas();
  }

  buildBucket() {
    this.bucket = new s3.Bucket(this, 'bucket');

    // Every time a file is uploaded to the bucket, processLambda function is invoked.
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(this.processLambda)
    );
  }

  buildLambdas() {
    const environment = {
      BUCKET_NAME: this.bucket.bucketName
    };
    const bundling = {
      minify: true,
      externalModules: ['aws-sdk', '@aws-sdk']
    };

    new lambdaNode.NodejsFunction(this, 'uploadLambda', {
      entry: '../src/node/lambdas/upload.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512, // MB.
      environment,
      bundling
    });

    this.processLambda = new lambdaNode.NodejsFunction(this, 'processLambda', {
      entry: '../src/node/lambdas/process.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(15), // Max timeout for lambda.
      memorySize: 1024, // MB.
      environment,
      bundling
    });
  }
}
