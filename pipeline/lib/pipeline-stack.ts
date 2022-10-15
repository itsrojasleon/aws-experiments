import * as cdk from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(
          'rojasleon/simple-ts-lambda-layer',
          'main'
        ),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });
  }
}
