import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export class GoNodeLambdaStack extends cdk.Stack {
  private bucket: s3.Bucket;
  private api: HttpApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.buildApiGW();
    this.buildBucket();
    this.buildLambdas();
  }

  buildBucket() {
    this.bucket = new s3.Bucket(this, 'bucket', {
      cors: [
        {
          allowedMethods: [s3.HttpMethods.POST], // What about adding PUT?
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

  buildLambdas() {
    const environment = {
      BUCKET_NAME: this.bucket.bucketName
    };
    const bundling: lambdaNode.BundlingOptions = {
      minify: true,
      externalModules: ['aws-sdk', '@aws-sdk']
    };

    const uploadLambda = new lambdaNode.NodejsFunction(this, 'uploadLambda', {
      entry: 'src/lambdas/upload.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512, // MB.
      environment,
      bundling
    });

    this.api.addRoutes({
      path: '/upload',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('upload', uploadLambda)
    });

    const processLambda = new lambdaNode.NodejsFunction(this, 'processLambda', {
      entry: 'src/lambdas/process.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(15), // Max timeout for lambda.
      memorySize: 2048, // MB.
      environment,
      bundling
    });
    this.bucket.grantReadWrite(processLambda);

    // Every time a file is uploaded to the bucket, processLambda function is invoked.
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processLambda)
    );
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
