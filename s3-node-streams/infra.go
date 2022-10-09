package main

import (
	"os"

	cdk "github.com/aws/aws-cdk-go/awscdk/v2"
	lambda "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	lambdanodejs "github.com/aws/aws-cdk-go/awscdk/v2/awslambdanodejs"
	s3 "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type InfraStackProps struct {
	cdk.StackProps
}

func NewInfraStack(scope constructs.Construct, id string, props *InfraStackProps) cdk.Stack {
	var sprops cdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	stack := cdk.NewStack(scope, &id, &sprops)

	bucket := s3.NewBucket(stack, jsii.String("NiceBucket"), &s3.BucketProps{})

	lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("uploadStreamLambda"),
		&lambdanodejs.NodejsFunctionProps{
			MemorySize: jsii.Number(128),
			Timeout:    cdk.Duration_Seconds(jsii.Number(20)),
			Runtime:    lambda.Runtime_NODEJS_16_X(),
			Handler:    jsii.String("handler"),
			Entry:      jsii.String("src/lambdas/stream/upload"),
			Environment: &map[string]*string{
				"BUCKET_NAME": bucket.BucketName(),
			},
		},
	)
	lambdanodejs.NewNodejsFunction(
		stack,
		jsii.String("uploadBufferLambda"),
		&lambdanodejs.NodejsFunctionProps{
			MemorySize: jsii.Number(128),
			Timeout:    cdk.Duration_Seconds(jsii.Number(20)),
			Runtime:    lambda.Runtime_NODEJS_16_X(),
			Handler:    jsii.String("handler"),
			Entry:      jsii.String("src/lambdas/buffer/upload"),
			Environment: &map[string]*string{
				"BUCKET_NAME": bucket.BucketName(),
			},
		},
	)

	return stack
}

func main() {
	defer jsii.Close()

	app := cdk.NewApp(nil)

	NewInfraStack(app, "InfraStack", &InfraStackProps{
		cdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

func env() *cdk.Environment {
	return &cdk.Environment{
		Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
		Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	}
}
