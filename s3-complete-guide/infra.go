// TODO: Build infra for lambdas.
package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type InfraStackProps struct {
	awscdk.StackProps
}

func NewUploadBufferStack(scope constructs.Construct, id string, props *InfraStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	stack := awscdk.NewStack(scope, &id, &sprops)

	awslambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("uploadBufferLambda"),
		&awslambdanodejs.NodejsFunctionProps{
			MemorySize: jsii.Number(128),
			Timeout:    awscdk.Duration_Seconds(jsii.Number(20)),
			Runtime:    awslambda.Runtime_NODEJS_16_X(),
			Handler:    jsii.String("handler"),
			Entry:      jsii.String("src/lambdas/buffer/upload"),
		},
	)

	awslambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("getBufferLambda"),
		&awslambdanodejs.NodejsFunctionProps{
			MemorySize: jsii.Number(128),
			Timeout:    awscdk.Duration_Seconds(jsii.Number(20)),
			Runtime:    awslambda.Runtime_NODEJS_16_X(),
			Handler:    jsii.String("handler"),
			Entry:      jsii.String("src/lambdas/buffer/upload"),
		},
	)
}

func NewInfraStack(scope constructs.Construct, id string, props *InfraStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	stack := awscdk.NewStack(scope, &id, &sprops)

	bucket := awss3.NewBucket(stack, jsii.String("NiceBucket"), &awss3.BucketProps{})

	uploadStreamLambda := awslambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("uploadStreamLambda"),
		&awslambdanodejs.NodejsFunctionProps{
			MemorySize: jsii.Number(128),
			Timeout:    awscdk.Duration_Seconds(jsii.Number(20)),
			Runtime:    awslambda.Runtime_NODEJS_16_X(),
			Handler:    jsii.String("handler"),
			Entry:      jsii.String("src/lambdas/stream/upload"),
		},
	)
	uploadStreamLambda := awslambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("uploadStreamLambda"),
		&awslambdanodejs.NodejsFunctionProps{
			MemorySize: jsii.Number(128),
			Timeout:    awscdk.Duration_Seconds(jsii.Number(20)),
			Runtime:    awslambda.Runtime_NODEJS_16_X(),
			Handler:    jsii.String("handler"),
			Entry:      jsii.String("src/lambdas/stream/upload"),
		},
	)

	awscdk.NewCfnOutput(stack, jsii.String("NiceBucketName"), &awscdk.CfnOutputProps{
		Value:      bucket.BucketName(),
		ExportName: jsii.String("NiceBucketName"),
	})

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewInfraStack(app, "InfraStack", &InfraStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

func env() *awscdk.Environment {
	return &awscdk.Environment{
		Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
		Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	}
}
