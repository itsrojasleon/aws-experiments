import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class GoNodeLambdaStack extends cdk.Stack {
  private bucket: s3.Bucket;
  private table: dynamo.Table;
  private api: HttpApi;
  private validationQueue: sqs.Queue;
  private processingQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.buildApiGW();
    this.buildBucket();
    this.buildQueues();
    this.buildDynamoTable();
    this.buildLambdas();
  }

  buildBucket() {
    this.bucket = new s3.Bucket(this, 'bucket', {
      cors: [
        {
          allowedMethods: [s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*']
        }
      ]
    });
  }

  buildDynamoTable() {
    this.table = new dynamo.Table(this, 'table', {
      partitionKey: {
        name: 'id',
        type: dynamo.AttributeType.STRING
      },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST
    });
  }

  buildQueues() {
    this.validationQueue = new sqs.Queue(this, 'validationQueue', {
      visibilityTimeout: cdk.Duration.minutes(2)
    });
    this.processingQueue = new sqs.Queue(this, 'processingQueue', {
      visibilityTimeout: cdk.Duration.minutes(2)
    });

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(this.validationQueue),
      { prefix: 'uploads/' }
    );

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(this.processingQueue),
      { prefix: 'validations/' }
    );
  }

  buildLambdas() {
    const bundling: lambdaNode.BundlingOptions = {
      minify: true,
      externalModules: ['aws-sdk', '@aws-sdk']
    };

    const uploadLambda = new lambdaNode.NodejsFunction(this, 'uploadLambda', {
      entry: 'src/lambdas/upload.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
        TABLE_NAME: this.table.tableName
      },
      bundling
    });
    this.table.grantWriteData(uploadLambda);
    this.api.addRoutes({
      path: '/upload',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('upload', uploadLambda)
    });
    this.bucket.grantPut(uploadLambda);

    const validateLambda = new lambdaNode.NodejsFunction(
      this,
      'validateLambda',
      {
        entry: 'src/lambdas/validate.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        memorySize: 1024,
        timeout: cdk.Duration.minutes(1),
        environment: {
          BUCKET_NAME: this.bucket.bucketName,
          TABLE_NAME: this.table.tableName
        },
        bundling
      }
    );
    this.validationQueue.grantConsumeMessages(validateLambda);
    this.table.grantWriteData(validateLambda);
    this.bucket.grantReadWrite(validateLambda);
    validateLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(this.validationQueue, {
        reportBatchItemFailures: true
      })
    );

    const processLambda = new lambdaNode.NodejsFunction(this, 'processLambda', {
      entry: 'src/lambdas/process.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 2048,
      timeout: cdk.Duration.minutes(1),
      bundling
    });
    this.bucket.grantReadWrite(processLambda);
    processLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(this.processingQueue, {
        reportBatchItemFailures: true
      })
    );

    const downloadLambda = new lambdaNode.NodejsFunction(
      this,
      'downloadLambda',
      {
        entry: 'src/lambdas/download.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        environment: {
          TABLE_NAME: this.table.tableName,
          BUCKET_NAME: this.bucket.bucketName
        },
        bundling
      }
    );
    this.table.grantReadWriteData(downloadLambda);
    this.bucket.grantRead(downloadLambda);
    this.api.addRoutes({
      path: '/download/{id}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('donwload', downloadLambda)
    });
  }

  buildApiGW() {
    this.api = new HttpApi(this, 'api', {
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.ANY],
        allowCredentials: false
      }
    });
  }
}
