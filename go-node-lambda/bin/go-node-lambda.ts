#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { GoNodeLambdaStack } from '../lib/go-node-lambda-stack';

const app = new cdk.App();
new GoNodeLambdaStack(app, 'GoNodeLambdaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
