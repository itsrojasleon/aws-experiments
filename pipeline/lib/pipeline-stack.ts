import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const artifact = new codepipeline.Artifact();

    const sourceAction = new codepipelineActions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'rojasleon',
      repo: 'simple-ts-lambda-layer',
      // Github token must be created manually.
      oauthToken: SecretValue.secretsManager('my-github-token'),
      output: artifact,
      branch: 'main'
    });

    const project = new codebuild.Project(this, 'project', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_6_0,
        computeType: codebuild.ComputeType.MEDIUM
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: 0.2,
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16.x'
            },
            commands: ['npm install']
          },
          // pre_build: {
          //   commands: [
          //     `cd service && touch .env && echo AWS_REGION=${
          //       props!.env!.region
          //     } >> .env && echo AWS_ACCOUNT_ID=${props!.env!.account} >> .env`
          //   ]
          // },
          build: {
            commands: ['npm run deploy']
          }
        }
      })
    });

    project.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['*']
      })
    );

    const codeBuildAction = new codepipelineActions.CodeBuildAction({
      actionName: 'codeBuildAction',
      project,
      input: artifact
    });

    new codepipeline.Pipeline(this, 'pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction]
        },
        {
          stageName: 'Deploy',
          actions: [codeBuildAction]
        }
      ]
    });
  }
}
