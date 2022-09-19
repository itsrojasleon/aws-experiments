import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaeventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as lambdanodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import path from 'path';

export class InternalStack extends cdk.Stack {
  bucket: s3.Bucket;
  api: apigateway.RestApi;
  queues: any = {};
  roles: any = {};

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.buildBucket();
    this.buildApiGateway();
    this.buildQueues();
    this.buildLambdas();
  }

  buildBucket() {
    this.bucket = new s3.Bucket(this, 'bucket');
  }

  buildApiGateway() {
    this.api = new apigateway.RestApi(this, 'internalApi');
  }

  buildLambdas() {
    const lambdaRole = new iam.Role(this, 'createRequestRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaSQSQueueExecutionRole'
        )
      ],
      inlinePolicies: {
        sendSQSMessage: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sqs:SendMessage'],
              resources: ['*']
            })
          ]
        })
      }
    });

    const createRequestFn = new lambdanodejs.NodejsFunction(
      this,
      'createRequestFn',
      {
        handler: 'handler',
        entry: path.join(__dirname, '../src/lambdas/create-request.ts'),
        runtime: lambda.Runtime.NODEJS_16_X,
        role: lambdaRole,
        environment: {
          BUCKET_NAME: this.bucket.bucketName,
          OBTAINING_PRODUCT_QUEUE_URL:
            this.queues.obtaitingProductQueue.queueUrl
        }
      }
    );
    this.api.root
      .addResource('requests')
      .addMethod('post', new apigateway.LambdaIntegration(createRequestFn));

    this.bucket.grantPut(createRequestFn);

    const getProductFn = new lambdanodejs.NodejsFunction(this, 'getProductFn', {
      handler: 'handler',
      entry: path.join(__dirname, '../src/lambdas/get-product.ts'),
      runtime: lambda.Runtime.NODEJS_16_X,
      role: lambdaRole,
      environment: {
        REQUEST_REDIRECTION_QUEUE_URL:
          this.queues.requestsRedirectionQueue.queueUrl
      }
    });
    getProductFn.addEventSource(
      new lambdaeventsources.SqsEventSource(this.queues.obtaitingProductQueue, {
        reportBatchItemFailures: true
      })
    );

    const getProductOfflineFn = new lambdanodejs.NodejsFunction(
      this,
      'getProductOfflineFn',
      {
        handler: 'handler',
        entry: path.join(__dirname, '../src/lambdas/offline/get-product.ts'),
        runtime: lambda.Runtime.NODEJS_16_X,
        role: lambdaRole,
        environment: {
          REQUEST_REDIRECTION_QUEUE_URL:
            this.queues.requestsRedirectionQueue.queueUrl
        }
      }
    );
    getProductOfflineFn.addEventSource(
      new lambdaeventsources.SqsEventSource(this.queues.obtaitingProductDLQ, {
        reportBatchItemFailures: true
      })
    );

    const redirectRequestFn = new lambdanodejs.NodejsFunction(
      this,
      'redirectRequestFn',
      {
        handler: 'handler',
        entry: path.join(__dirname, '../src/lambdas/redirect-request.ts'),
        runtime: lambda.Runtime.NODEJS_16_X,
        role: lambdaRole,
        environment: {
          BUCKET_NAME: this.bucket.bucketName,
          HANDLE_PURCHASE_QUEUE_URL: this.queues.purchaseHandlerQueue.queueUrl,
          HANDLE_QUESTION_QUEUE_URL: this.queues.questionHandlerQueue.queueUrl,
          HANDLE_OFFLINE_PURCHASE_QUEUE_URL:
            this.queues.purchaseOfflineHandlerQueue.queueUrl,
          HANDLE_OFFLINE_QUESTION_QUEUE_URL:
            this.queues.questionOfflineHandlerQueue.queueUrl
        }
      }
    );
    redirectRequestFn.addEventSource(
      new lambdaeventsources.SqsEventSource(
        this.queues.requestsRedirectionQueue,
        {
          reportBatchItemFailures: true
        }
      )
    );
    this.bucket.grantRead(redirectRequestFn);

    const handlePurchaseFn = new lambdanodejs.NodejsFunction(
      this,
      'handlePurchaseFn',
      {
        handler: 'handler',
        entry: path.join(__dirname, '../src/lambdas/handle-purchase.ts'),
        runtime: lambda.Runtime.NODEJS_16_X,
        role: lambdaRole
      }
    );
    handlePurchaseFn.addEventSource(
      new lambdaeventsources.SqsEventSource(this.queues.purchaseHandlerQueue, {
        reportBatchItemFailures: true
      })
    );

    const handleQuestionFn = new lambdanodejs.NodejsFunction(
      this,
      'handleQuestionFn',
      {
        handler: 'handler',
        entry: path.join(__dirname, '../src/lambdas/handle-question.ts'),
        runtime: lambda.Runtime.NODEJS_16_X,
        role: lambdaRole
      }
    );
    handleQuestionFn.addEventSource(
      new lambdaeventsources.SqsEventSource(this.queues.questionHandlerQueue, {
        reportBatchItemFailures: true
      })
    );

    const handleOfflinePurchaseFn = new lambdanodejs.NodejsFunction(
      this,
      'handleOfflinePurchaseFn',
      {
        handler: 'handler',
        entry: path.join(
          __dirname,
          '../src/lambdas/offline/handle-purchase.ts'
        ),
        runtime: lambda.Runtime.NODEJS_16_X,
        role: lambdaRole
      }
    );
    handleOfflinePurchaseFn.addEventSource(
      new lambdaeventsources.SqsEventSource(
        this.queues.purchaseOfflineHandlerQueue,
        {
          reportBatchItemFailures: true
        }
      )
    );

    const handleOfflineQuestionFn = new lambdanodejs.NodejsFunction(
      this,
      'handleOfflineQuestionFn',
      {
        handler: 'handler',
        entry: path.join(
          __dirname,
          '../src/lambdas/offline/handle-question.ts'
        ),
        runtime: lambda.Runtime.NODEJS_16_X,
        role: lambdaRole
      }
    );
    handleOfflineQuestionFn.addEventSource(
      new lambdaeventsources.SqsEventSource(
        this.queues.questionOfflineHandlerQueue,
        {
          reportBatchItemFailures: true
        }
      )
    );
  }

  buildQueues() {
    this.queues.obtaitingProductDLQ = new sqs.Queue(
      this,
      'obtaitingProductDLQ',
      { deliveryDelay: cdk.Duration.seconds(10) }
    );
    this.queues.obtaitingProductQueue = new sqs.Queue(
      this,
      'obtaitingProductQueue',
      {
        deadLetterQueue: {
          maxReceiveCount: 1,
          queue: this.queues.obtaitingProductDLQ
        }
      }
    );
    this.queues.requestsRedirectionQueue = new sqs.Queue(
      this,
      'requestsRedirectionQueue'
    );

    this.queues.purchaseHandlerQueue = new sqs.Queue(
      this,
      'purchaseHandlerQueue'
    );
    this.queues.questionHandlerQueue = new sqs.Queue(
      this,
      'questionHandlerQueue'
    );
    this.queues.purchaseOfflineHandlerQueue = new sqs.Queue(
      this,
      'purchaseOfflineHandlerQueue'
    );
    this.queues.questionOfflineHandlerQueue = new sqs.Queue(
      this,
      'questionOfflineHandlerQueue'
    );
  }
}
