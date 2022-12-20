import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
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

    // TODO: Is there another approach where I can give upload access to
    // the bucket in a more secure way?.
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject'],
        principals: [new iam.AnyPrincipal()],
        resources: [`${this.bucket.bucketArn}/*`]
      })
    );
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
    this.validationQueue = new sqs.Queue(this, 'validationQueue');

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(this.validationQueue)
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

    this.api.addRoutes({
      path: '/upload',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('upload', uploadLambda)
    });
    this.table.grantWriteData(uploadLambda);

    const validateLambda = new lambdaNode.NodejsFunction(
      this,
      'validateLambda',
      {
        entry: 'src/lambdas/validate.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        memorySize: 1024,
        environment: {
          BUCKET_NAME: this.bucket.bucketName
        },
        bundling
      }
    );

    this.validationQueue.grantConsumeMessages(validateLambda);

    this.bucket.grantReadWrite(validateLambda);

    validateLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(this.validationQueue, {
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
          TABLE_NAME: this.table.tableName
        },
        bundling
      }
    );

    this.table.grantReadData(downloadLambda);

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
